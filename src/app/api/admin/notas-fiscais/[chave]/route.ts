import { apiSession } from "@shared/server/auth/session";
import { downloadInvoice, fiscalRoles } from "@shared/server/fiscal/repository";

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
    const xml = await downloadInvoice(chave);
    if (!xml) return new Response(null, { status: 404, headers });
    return new Response(Uint8Array.from(xml), {
      headers: {
        ...headers,
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="NFe-${chave}.xml"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Arquivo indisponível." },
      { status: 503, headers },
    );
  }
}
