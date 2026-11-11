import Link from "next/link";
import ChangeHistoryFilters from "@shared/components/admin/ChangeHistoryFilters";
import { dateRangeSchema } from "@shared/lib/admin/date-range";
import ProductThumbnail from "@shared/components/admin/ProductThumbnail";
import { adminContext, adminChanges } from "@shared/server/admin/repository";
import {
  PageHeading,
  DataNotice,
  EmptyState,
  Pagination,
  number,
  dateTime,
} from "@shared/components/admin/Primitives";
import { formatMoney } from "@shared/lib/money";
export default async function Changes({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    start?: string;
    end?: string;
    kind?: string;
  }>;
}) {
  const params = await searchParams;
  const raw = params.page;
  const kind = ["added", "removed", "changed"].includes(params.kind || "")
    ? params.kind!
    : "all";
  const parsed = dateRangeSchema.safeParse({
    start: params.start || "",
    end: params.end || "",
  });
  const range = parsed.success ? parsed.data : { start: "", end: "" };
  const page = Math.max(1, Math.min(10000, Number(raw) || 1));
  const context = await adminContext("changes");
  const data = await adminChanges(Math.floor(page), range, kind);
  const labels: Record<string, string> = {
    added: "Entrou na Shopify",
    removed: "Saiu desta versão",
    changed: "Informação alterada",
  };
  return (
    <>
      <PageHeading
        eyebrow="SHOPIFY → CATÁLOGO"
        title="Alterações na Shopify"
        description="Veja quais dados dos produtos mudaram na Shopify entre as sincronizações do catálogo. O filtro usa a data em que a diferença foi detectada. A última atualização do produto na Shopify aparece quando disponível."
        filters={<ChangeHistoryFilters range={range} kind={kind} />}
      />
      <DataNotice context={context} />
      {!parsed.success && (
        <p role="alert">Escolha um período válido de até 366 dias.</p>
      )}
      <div className="admin-mini-stats history-summary">
        {[
          ["Entraram", data.counts.added, "added"],
          ["Saíram", data.counts.removed, "removed"],
          ["Alterados", data.counts.changed, "changed"],
        ].map(([label, value, filter]) => (
          <Link
            key={String(label)}
            aria-current={kind === filter ? "page" : undefined}
            href={`/gestor/alteracoes/?${new URLSearchParams({ ...range, kind: kind === filter ? "all" : String(filter) })}`}
          >
            <span>{label}</span>
            <strong>{number(value as number | undefined)}</strong>
            <small>
              {kind === filter
                ? "Selecionado · clique para ver todos"
                : "Clique para visualizar"}
            </small>
          </Link>
        ))}
      </div>
      <section className="admin-panel">
        {!context.previous ? (
          <EmptyState
            title="Uma história que começa agora"
            description="A comparação ficará disponível após duas importações publicadas. A primeira versão é a referência inicial."
          />
        ) : !data.items.length ? (
          <EmptyState
            title="Nenhuma alteração encontrada"
            description="Não há diferenças registradas nas publicações deste período. Tente outro intervalo ou escolha a última publicação."
          />
        ) : (
          <div
            className="admin-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Alterações de produtos na Shopify"
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Detectado na sincronização</th>
                  <th>Produto / SKU</th>
                  <th>O que mudou</th>
                  <th>Preço</th>
                  <th>Estoque anterior</th>
                  <th>Estoque atual</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const product = item.product_id?.match(
                    /^gid:\/\/shopify\/Product\/(\d+)$/,
                  )?.[1];
                  const shopifyUrl =
                    product &&
                    /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(
                      item.store_domain,
                    )
                      ? `https://${item.store_domain}/admin/products/${product}`
                      : null;
                  const shopifyUpdated =
                    item.shopify_updated_at &&
                    Number.isFinite(Date.parse(item.shopify_updated_at))
                      ? dateTime(item.shopify_updated_at)
                      : null;
                  const priceChanged =
                    item.kind === "changed" && item.fields.includes("Preço");
                  const differences = [
                    ["Nome", item.old_name, item.name],
                    ["SKU", item.old_sku, item.current_sku],
                    ["Marca", item.old_vendor, item.vendor],
                    ["Categoria", item.old_category, item.category],
                    [
                      "Preço de comparação",
                      item.old_compare_at_price === null
                        ? null
                        : formatMoney(
                            item.old_compare_at_price,
                            item.old_currency || "BRL",
                          ),
                      item.compare_at_price === null
                        ? null
                        : formatMoney(
                            item.compare_at_price,
                            item.currency || "BRL",
                          ),
                    ],
                  ].filter(([label]) => label && item.fields.includes(label));
                  return (
                    <tr key={`${item.version}-${item.id}`}>
                      <td>
                        {dateTime(item.recorded_at)}
                        {shopifyUpdated && (
                          <small>
                            Última atualização do produto na Shopify:{" "}
                            {shopifyUpdated}
                          </small>
                        )}
                      </td>
                      <td>
                        <div className="admin-product-name admin-change-product">
                          <ProductThumbnail src={item.image} />
                          <div>
                            {shopifyUrl ? (
                              <a
                                className="admin-text-link"
                                href={shopifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {item.name}
                              </a>
                            ) : (
                              <strong>{item.name}</strong>
                            )}
                            <small>SKU {item.sku || "não informado"}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${item.kind === "added" ? "green" : item.kind === "removed" ? "rose" : "blue"}`}
                        >
                          {labels[item.kind]}
                        </span>
                        <small>
                          {item.kind === "added"
                            ? "Não constava na sincronização anterior"
                            : item.kind === "removed"
                              ? "Produto ausente nesta versão; não indica venda"
                              : item.fields.join(", ")}
                        </small>
                        {item.kind === "changed" &&
                          differences.map(([label, oldValue, newValue]) => (
                            <small className="history-field-change" key={label}>
                              <b>{label}</b> {oldValue || "Não informado"} →{" "}
                              {newValue || "Não informado"}
                            </small>
                          ))}
                        {item.kind === "changed" &&
                          item.fields.includes("Descrição") && (
                            <details className="history-field-change">
                              <summary>Ver trechos da descrição</summary>
                              <small>
                                <b>Antes:</b>{" "}
                                {item.old_description || "Não informado"}
                              </small>
                              <small>
                                <b>Depois:</b>{" "}
                                {item.description || "Não informado"}
                              </small>
                            </details>
                          )}
                      </td>
                      <td>
                        {item.kind === "removed" ? (
                          "Fora do catálogo"
                        ) : item.price !== null ? (
                          <strong>
                            {formatMoney(item.price, item.currency || "BRL")}
                          </strong>
                        ) : (
                          "Não informado"
                        )}
                        {priceChanged && item.old_price !== null && (
                          <small>
                            Anterior:{" "}
                            {formatMoney(
                              item.old_price,
                              item.old_currency || "BRL",
                            )}
                          </small>
                        )}
                      </td>
                      <td>
                        {item.kind === "added"
                          ? "—"
                          : item.old_stock === null
                            ? "Não informado"
                            : `${number(item.old_stock)} un.`}
                      </td>
                      <td>
                        {item.kind === "removed"
                          ? "Fora do catálogo"
                          : item.stock === null
                            ? "Não informado"
                            : `${number(item.stock)} un.`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {context.previous && (
        <Pagination
          {...data}
          base="/gestor/alteracoes/"
          params={{ ...range, kind }}
        />
      )}
    </>
  );
}
