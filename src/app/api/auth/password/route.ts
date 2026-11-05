import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { readJsonBody } from "@shared/server/http/body";
import { database } from "@shared/server/database/client";
import {
  authConfigured,
  currentSession,
  opaqueKey,
  sameOrigin,
} from "@shared/server/auth/session";
import {
  credentialVersion,
  hashPassword,
  verifyPassword,
} from "@shared/server/auth/crypto";
import { consumeLoginBucket } from "@shared/server/auth/limits";

const password = z.string().min(12).max(128);
const input = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("request"),
    email: z.email().max(254).trim().toLowerCase(),
  }),
  z.object({ action: z.literal("issue"), id: z.string().regex(/^\d{1,18}$/) }),
  z.object({
    action: z.literal("reset"),
    token: z.string().regex(/^\d{1,18}\.\d{13}\.[a-f0-9]{64}$/),
    password,
  }),
  z.object({
    action: z.literal("change"),
    current: z.string().min(1).max(128),
    password,
  }),
]);

const reply = (body: object, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

async function recoveryUser(id: string) {
  const { rows } = await database().query<{
    id: string;
    email: string;
    password_hash: string;
  }>(
    `SELECT u.id,u.email,u.password_hash
       FROM pitterpan_admin_events e JOIN pitterpan_admin_users u ON u.id::text=e.details->>'userId'
      WHERE e.id=$1 AND e.action='password.requested' AND NOT u.disabled
        AND e.created_at > now() - interval '7 days'
        AND e.details->>'version' IS NOT NULL`,
    [id],
  );
  return rows[0];
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return reply({ error: "Solicitação inválida." }, 403);
  if (!authConfigured() || !process.env.DATABASE_URL)
    return reply({ error: "Serviço indisponível." }, 503);
  const body = await readJsonBody(request, 4096);
  if (body.response) return body.response;
  const parsed = input.safeParse(body.value);
  if (!parsed.success)
    return reply(
      {
        error:
          "Confira os dados. A nova senha deve ter de 12 a 128 caracteres.",
      },
      400,
    );
  const data = parsed.data;
  try {
    const db = database();
    const windowId = Math.floor(Date.now() / 900_000);
    if (data.action === "request") {
      const ip = request.headers.get("x-real-ip") || "unknown";
      if (
        (await consumeLoginBucket(
          db,
          opaqueKey("recovery-ip:" + ip),
          windowId,
        )) &&
        (await consumeLoginBucket(
          db,
          opaqueKey("recovery-email:" + data.email),
          windowId,
        ))
      ) {
        const {
          rows: [user],
        } = await db.query<{
          id: string;
          email: string;
          password_hash: string;
        }>(
          "SELECT id,email,password_hash FROM pitterpan_admin_users WHERE email=$1 AND NOT disabled",
          [data.email],
        );
        if (user) {
          const version = credentialVersion(user.password_hash);
          await db.query(
            `INSERT INTO pitterpan_admin_events(actor,action,details)
             SELECT $1,'password.requested',jsonb_build_object('userId',$2::text,'version',$3::text)
             WHERE NOT EXISTS (
               SELECT 1 FROM pitterpan_admin_events WHERE actor=$1 AND action='password.requested'
                 AND details->>'version'=$3 AND created_at > now() - interval '15 minutes'
             )`,
            [user.email, user.id, version],
          );
        }
      }
      return reply({ ok: true });
    }

    if (data.action === "issue") {
      const session = await currentSession();
      if (session?.sub !== "bootstrap")
        return reply({ error: "Acesso reservado ao master." }, 403);
      const user = await recoveryUser(data.id);
      if (!user) return reply({ error: "Solicitação indisponível." }, 404);
      const version = credentialVersion(user.password_hash);
      const { rowCount } = await db.query(
        "SELECT 1 FROM pitterpan_admin_events WHERE id=$1 AND details->>'version'=$2",
        [data.id, version],
      );
      if (!rowCount)
        return reply({ error: "A senha desta conta já foi alterada." }, 409);
      const payload = `${data.id}.${Date.now() + 30 * 60_000}`;
      return reply({
        token: `${payload}.${opaqueKey(`password-reset:${payload}:${version}`)}`,
      });
    }

    let user;
    if (data.action === "change") {
      const session = await currentSession();
      if (!session || session.sub === "bootstrap")
        return reply(
          { error: "Use uma conta da equipe para alterar a senha." },
          403,
        );
      if (
        !(await consumeLoginBucket(
          db,
          opaqueKey("password-change:" + session.sub),
          windowId,
        ))
      )
        return reply(
          { error: "Muitas tentativas. Tente novamente mais tarde." },
          429,
        );
      const { rows } = await db.query<{
        id: string;
        email: string;
        password_hash: string;
      }>(
        "SELECT id,email,password_hash FROM pitterpan_admin_users WHERE id=$1 AND NOT disabled",
        [session.sub],
      );
      user = rows[0];
      if (
        !user ||
        credentialVersion(user.password_hash) !== session.version ||
        !(await verifyPassword(data.current, user.password_hash))
      )
        return reply({ error: "A senha atual está incorreta." }, 400);
      if (data.current === data.password)
        return reply({ error: "Escolha uma senha diferente da atual." }, 400);
    } else {
      const [id, expiry, signature] = data.token.split(".");
      user = Number(expiry) > Date.now() ? await recoveryUser(id) : undefined;
      if (
        !user ||
        !timingSafeEqual(
          Buffer.from(signature, "hex"),
          Buffer.from(
            opaqueKey(
              `password-reset:${id}.${expiry}:${credentialVersion(user.password_hash)}`,
            ),
            "hex",
          ),
        )
      )
        return reply(
          { error: "Link inválido, expirado ou já utilizado." },
          400,
        );
    }

    const hash = await hashPassword(data.password);
    const { rowCount } = await db.query(
      `WITH changed AS (
        UPDATE pitterpan_admin_users SET password_hash=$2
        WHERE id=$1 AND password_hash=$3 AND NOT disabled RETURNING id,email
      )
      INSERT INTO pitterpan_admin_events(actor,action,details)
      SELECT email,$4,jsonb_build_object('userId',id) FROM changed`,
      [
        user.id,
        hash,
        user.password_hash,
        data.action === "change" ? "password.changed" : "password.reset",
      ],
    );
    return rowCount
      ? reply({ ok: true })
      : reply({ error: "A conta foi alterada. Reabra a solicitação." }, 409);
  } catch {
    return reply(
      { error: "Serviço indisponível. Tente novamente mais tarde." },
      503,
    );
  }
}
