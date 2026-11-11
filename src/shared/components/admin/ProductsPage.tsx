import {
  adminContext,
  adminProducts,
  adminQuerySchema,
} from "../../server/admin/repository";
import { DataNotice, PageHeading, Pagination, number } from "./Primitives";
import ProductList, { ProductFilters } from "./ProductList";
export default async function ProductsPage({
  searchParams,
  mode = "products",
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  mode?: "products" | "stock" | "offers";
}) {
  const raw = await searchParams;
  const parsed = adminQuerySchema.safeParse({
    ...raw,
    ...(mode === "offers" ? { offers: "1" } : {}),
  });
  const query = parsed.success
    ? parsed.data
    : adminQuerySchema.parse({ offers: mode === "offers" ? "1" : "0" });
  const view = mode === "stock" ? "stock" : "basic";
  const [context, result] = await Promise.all([
    adminContext(view),
    adminProducts(query, { view }),
  ]);
  const base =
    mode === "stock"
      ? "/gestor/estoque/"
      : mode === "offers"
        ? "/gestor/ofertas/"
        : "/gestor/produtos/";
  return (
    <>
      <PageHeading
        title={
          mode === "stock"
            ? "Estoque"
            : mode === "offers"
              ? "Ofertas"
              : "Produtos"
        }
        description={
          mode === "stock"
            ? "Quantidades agregadas da última importação. Não representam uma reserva ou disponibilidade por loja."
            : mode === "offers"
              ? "Variantes com preço menor que o preço anterior cadastrado. Vigência e regras finais são confirmadas na loja."
              : "Encontre produtos por nome, SKU ou marca e consulte os detalhes da sua seleção."
        }
        filters={
          <ProductFilters
            query={query}
            base={base}
            canExport={result.products.length > 0}
          />
        }
      />
      <DataNotice context={context} />
      {mode === "stock" && (
        <div className="admin-mini-stats">
          {[
            ["Estoque baixo", context.summary?.low],
            ["Sem estoque", context.summary?.out],
            ["Estoque alto", context.summary?.high],
            ["Não informado", context.summary?.unknown],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <span>{label}</span>
              <strong>{number(value as number | undefined)}</strong>
            </div>
          ))}
        </div>
      )}
      <ProductList products={result.products} settings={context.settings} />
      <Pagination
        {...result}
        base={base}
        params={Object.fromEntries(
          Object.entries(query).map(([k, v]) => [k, String(v)]),
        )}
      />
    </>
  );
}
