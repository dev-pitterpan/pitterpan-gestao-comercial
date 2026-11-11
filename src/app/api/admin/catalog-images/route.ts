import { database } from "@shared/server/database/client";
import { z } from "zod";
import { apiSession, sameOrigin } from "@shared/server/auth/session";
import { readJsonBody } from "@shared/server/http/body";
import {
  listImages,
  processImages,
} from "@shared/server/catalog-images/repository";

export const maxDuration = 120;
const headers = { "Cache-Control": "no-store" };
const selection = z.object({
  sources: z.array(z.string().max(2048)).max(12).optional(),
});

function unavailable() {
  return Response.json(
    {
      error:
        "Não foi possível acessar as imagens. Confira a migração do banco do catálogo.",
    },
    { status: 503, headers },
  );
}

export async function GET(request: Request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  if (source) {
    try {
      const { rows } = await database().query<{ webp: Buffer }>(
        "SELECT webp FROM pitterpan_catalog_images WHERE source=$1 AND status='completed'",
        [source],
      );
      return rows[0]?.webp
        ? new Response(new Uint8Array(rows[0].webp), {
            headers: {
              ...headers,
              "Content-Type": "image/webp",
              "X-Content-Type-Options": "nosniff",
            },
          })
        : new Response(null, { status: 404, headers });
    } catch {
      return unavailable();
    }
  }

  const page = Number(searchParams.get("page") ?? 1);
  const days = Number(searchParams.get("days") ?? 0);
  const status = searchParams.get("status") ?? "";
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000 ||
    ![0, 7, 30, 90].includes(days) ||
    !["", "pending", "completed", "failed"].includes(status)
  )
    return Response.json(
      { error: "Filtro inválido." },
      { status: 400, headers },
    );
  try {
    return Response.json(
      await listImages(
        (searchParams.get("q") ?? "").slice(0, 100),
        status,
        page,
        days,
      ),
      { headers },
    );
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  if (!sameOrigin(request))
    return Response.json(
      { error: "Solicitação inválida." },
      { status: 403, headers },
    );
  const body = await readJsonBody(request);
  if (body.response) return body.response;
  const input = selection.safeParse(body.value);
  if (!input.success)
    return Response.json(
      { error: "Seleção inválida." },
      { status: 400, headers },
    );
  try {
    return Response.json(await processImages(input.data.sources), { headers });
  } catch {
    return unavailable();
  }
}
