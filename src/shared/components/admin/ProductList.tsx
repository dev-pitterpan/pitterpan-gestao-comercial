"use client";
import { useEffect, useState } from "react";
import AutoFilterForm from "./AutoFilterForm";
import AdminSelect from "./AdminSelect";
import { Download, Search, ArrowUpRight, Package } from "lucide-react";
import type { AdminProduct, AdminQuery } from "../../server/admin/repository";
import { formatMoney } from "../../lib/money";
import { cardImage } from "../../lib/catalog/image";
import { number } from "./Primitives";
export function stockLabel(stock: number | null, low: number, high: number) {
  return stock === null
    ? { label: "Não informado", tone: "neutral" }
    : stock <= 0
      ? { label: "Sem estoque", tone: "rose" }
      : stock <= low
        ? { label: "Estoque baixo", tone: "amber" }
        : stock >= high
          ? { label: "Estoque alto", tone: "green" }
          : { label: "Disponível", tone: "blue" };
}
export function ProductFilters({
  query,
  base,
  canExport,
}: {
  query: AdminQuery;
  base: string;
  canExport: boolean;
}) {
  const [stock, setStock] = useState(query.stock);
  useEffect(() => setStock(query.stock), [query.stock]);
  const { page: _page, ...filters } = query;
  const exportHref =
    "/api/admin/products/?" +
    new URLSearchParams({ ...filters, format: "csv" });
  return (
    <AutoFilterForm action={base} className="admin-filter-bar">
      <label className="admin-filter-search">
        <Search size={17} />
        <input
          name="q"
          defaultValue={query.q}
          placeholder="Buscar por nome, SKU ou marca"
          aria-label="Buscar produtos"
        />
      </label>
      <input
        className="admin-filter-input"
        name="category"
        defaultValue={query.category}
        placeholder="Buscar categoria"
        aria-label="Filtrar categoria"
      />
      <input
        className="admin-filter-input"
        name="vendor"
        defaultValue={query.vendor}
        placeholder="Buscar marca"
        aria-label="Filtrar marca"
      />
      {query.offers === "1" && <input type="hidden" name="offers" value="1" />}
      <label className="admin-sr-only" htmlFor="stock-filter">
        Situação de estoque
      </label>
      <AdminSelect
        id="stock-filter"
        name="stock"
        value={stock}
        label="Situação de estoque"
        onValueChange={(value) => setStock(value as AdminQuery["stock"])}
        options={[
          { value: "all", label: "Todo o estoque" },
          { value: "low", label: "Estoque baixo" },
          { value: "above", label: "Acima do estoque baixo" },
          { value: "high", label: "Estoque alto" },
          { value: "out", label: "Sem estoque" },
          { value: "unknown", label: "Não informado" },
        ]}
      />
      <button type="submit" className="admin-button admin-button-primary">
        Aplicar agora
      </button>
      {canExport && (
        <a className="admin-button" href={exportHref} download>
          <Download size={16} /> Exportar resultados filtrados
        </a>
      )}
    </AutoFilterForm>
  );
}

export default function ProductList({
  products,
  settings,
}: {
  products: AdminProduct[];
  settings: { low: number; high: number };
}) {
  return (
    <section className="admin-panel admin-product-panel">
      {products.length ? (
        <div
          className="admin-table-scroll"
          role="region"
          aria-label="Resultados de produtos com rolagem horizontal"
          tabIndex={0}
        >
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria / marca</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Situação</th>
                <th>
                  <span className="admin-sr-only">Link</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = stockLabel(
                  p.inventoryQuantity,
                  settings.low,
                  settings.high,
                );
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-product-name">
                        <img
                          src={cardImage(p.image, 120)}
                          alt=""
                          width={48}
                          height={48}
                          loading="lazy"
                        />
                        <div>
                          <strong>{p.name}</strong>
                          <small>SKU {p.sku || "não informado"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{p.category || "Sem categoria"}</strong>
                      <small>{p.vendor || "Marca não informada"}</small>
                    </td>
                    <td>
                      <strong>
                        {p.price !== undefined
                          ? formatMoney(p.price, p.currency)
                          : "Não informado"}
                      </strong>
                      {p.compareAtPrice && (
                        <small>
                          Anterior: {formatMoney(p.compareAtPrice, p.currency)}
                        </small>
                      )}
                    </td>
                    <td>
                      <strong>{number(p.inventoryQuantity)}</strong>
                    </td>
                    <td>
                      <span className={`admin-badge ${stock.tone}`}>
                        {stock.label}
                      </span>
                    </td>
                    <td>
                      {p.siteUrl && (
                        <a
                          href={p.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Ver ${p.name} na loja`}
                        >
                          <ArrowUpRight size={17} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">
          <span>
            <Package size={25} />
          </span>
          <h3>Nenhum produto nesta seleção</h3>
          <p>
            Revise os filtros ou confira a primeira importação em
            Sincronizações.
          </p>
        </div>
      )}
    </section>
  );
}
