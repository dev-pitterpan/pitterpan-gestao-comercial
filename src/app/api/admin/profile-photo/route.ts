import sharp from "sharp";
import { apiSession, sameOrigin } from "@shared/server/auth/session";
import { database } from "@shared/server/database/client";
import { readJsonBody } from "@shared/server/http/body";

const maxBytes = 2 * 1024 * 1024;
const headers = { "Cache-Control": "private, no-store" };
const profileKey = ({ sub, email }: { sub: string; email: string }) =>
  sub === "bootstrap" ? `bootstrap:${email}` : sub;

function unavailable() {
  return Response.json(
    { error: "Não foi possível acessar a foto de perfil. Tente novamente." },
    { status: 503, headers },
  );
}

export async function GET() {
  const auth = await apiSession();
  if (auth.error) return auth.error;
  try {
    const { rows } = await database().query<{ photo: Buffer }>(
      "SELECT photo FROM pitterpan_admin_profile_photos WHERE profile_key=$1",
      [profileKey(auth.session)],
    );
    if (!rows[0]) return new Response(null, { status: 204, headers });
    const photo = rows[0].photo;
    const isWebp =
      photo.toString("ascii", 0, 4) === "RIFF" &&
      photo.toString("ascii", 8, 12) === "WEBP";
    return new Response(new Uint8Array(photo), {
      headers: {
        ...headers,
        "Content-Type": isWebp ? "image/webp" : "image/jpeg",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch {
    return unavailable();
  }
}

export async function PUT(request: Request) {
  const auth = await apiSession();
  if (auth.error) return auth.error;
  if (!sameOrigin(request))
    return Response.json(
      { error: "Solicitação inválida." },
      { status: 403, headers },
    );

  const body = await readJsonBody(request, Math.ceil(maxBytes / 3) * 4 + 64);
  if (body.response) return body.response;
  const image = body.value;
  let photo: Buffer;
  try {
    if (typeof image !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(image))
      throw new Error("Imagem inválida");
    const data = Buffer.from(image, "base64");
    if (data.length > maxBytes) throw new Error("Imagem muito grande");
    const source = sharp(data, { limitInputPixels: 16_000_000 });
    const { format } = await source.metadata();
    if (format !== "jpeg" && format !== "png" && format !== "webp")
      throw new Error("Formato inválido");
    photo = await source
      .autoOrient()
      .resize(256, 256, { fit: "cover" })
      .flatten({ background: "#f3f6fb" })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    return Response.json(
      {
        error:
          "Não foi possível processar a foto. Escolha um JPG, PNG ou WebP válido.",
      },
      { status: 400, headers },
    );
  }

  try {
    await database().query(
      `INSERT INTO pitterpan_admin_profile_photos (profile_key, photo)
       VALUES ($1, $2) ON CONFLICT (profile_key)
       DO UPDATE SET photo=EXCLUDED.photo`,
      [profileKey(auth.session), photo],
    );
    return new Response(null, { status: 204, headers });
  } catch {
    return unavailable();
  }
}

export async function DELETE(request: Request) {
  const auth = await apiSession();
  if (auth.error) return auth.error;
  if (!sameOrigin(request))
    return Response.json(
      { error: "Solicitação inválida." },
      { status: 403, headers },
    );
  try {
    await database().query(
      "DELETE FROM pitterpan_admin_profile_photos WHERE profile_key=$1",
      [profileKey(auth.session)],
    );
    return new Response(null, { status: 204, headers });
  } catch {
    return unavailable();
  }
}
