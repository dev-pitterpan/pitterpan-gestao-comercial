import {
  ADMIN_PRODUCT_PAGE_SIZE,
  adminContext,
  adminProducts,
  adminQuerySchema,
} from "../../server/admin/repository";
import { DataNotice, PageHeading, number } from "./Primitives";
import AutoFilterForm from "./AutoFilterForm";
import TablePagination from "./TablePagination";
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
  const pageHref = (page: number) =>
    `${base}?${new URLSearchParams({ ...query, page: String(page) })}`;
  const offset = (result.page - 1) * ADMIN_PRODUCT_PAGE_SIZE;
  return (
    <AutoFilterForm action={base} className="admin-products-form">
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
      <section className="admin-panel admin-product-panel">
        <ProductList
          resetKey={pageHref(result.page)}
          search={query.q}
          products={result.products}
          settings={context.settings}
        />
        {result.total > 0 && (
          <TablePagination
            label="Páginas de produtos"
            page={result.page}
            pages={result.pages}
            range={`${number(offset + 1)}–${number(offset + result.products.length)} de ${number(result.total)} produtos`}
            hrefs={{
              previous: result.page > 1 ? pageHref(result.page - 1) : undefined,
              next:
                result.page < result.pages
                  ? pageHref(result.page + 1)
                  : undefined,
            }}
          />
        )}
      </section>
    </AutoFilterForm>
  );
}
