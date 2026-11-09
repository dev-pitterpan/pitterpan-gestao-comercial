import { csvCell } from "@shared/lib/admin/csv";
import { apiSession } from "@shared/server/auth/session";
import {
  adminProducts,
  adminQuerySchema,
} from "@shared/server/admin/repository";
export async function GET(request: Request) {
  const auth = await apiSession();
  if (auth.error) return auth.error;
  const params = new URL(request.url).searchParams;
  const parsed = adminQuerySchema.safeParse(Object.fromEntries(params));
  if (!parsed.success)
    return Response.json({ error: "Filtros inválidos." }, { status: 400 });
  try {
    if (params.get("format") === "csv") {
      const { products } = await adminProducts(parsed.data, { all: true });
      const rows = [
        ["SKU", "Produto", "Categoria", "Marca", "Preço", "Estoque"],
        ...products.map((p) => [
          p.sku || p.id,
          p.name,
          p.category,
          p.vendor,
          p.price,
          p.inventoryQuantity,
        ]),
      ];
      return new Response(
        "\ufeff" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n"),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="pitterpan-produtos-filtrados.csv"',
            "Cache-Control": "no-store",
          },
        },
      );
    }
    return Response.json(await adminProducts(parsed.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Não foi possível consultar os produtos." },
      { status: 503 },
    );
  }
}
