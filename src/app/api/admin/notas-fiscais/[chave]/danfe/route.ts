import { apiSession } from "@shared/server/auth/session";
import { downloadDanfe, fiscalRoles } from "@shared/server/fiscal/repository";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chave: string }> },
) {
  const auth = await apiSession(fiscalRoles);
  if (auth.error) return auth.error;
  const { chave } = await params;
  if (!/^\d{44}$/.test(chave))
    return new Response(null, { status: 404, headers });

  try {
    const pdf = await downloadDanfe(chave);
    if (!pdf) return new Response(null, { status: 404, headers });
    return new Response(Uint8Array.from(pdf), {
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="DANFE-${chave}.pdf"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      },
    });
  } catch {
    return Response.json(
      { error: "Arquivo indisponível." },
      { status: 503, headers },
    );
  }
}
