"use client";
import { useEffect, useState } from "react";
import HeaderFilterGroup from "./HeaderFilterGroup";
import DragScroll from "./DragScroll";
import { Search, ArrowUpRight, Package } from "lucide-react";
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
const stockOptions = [
  { value: "all", label: "Todo o estoque" },
  { value: "low", label: "Estoque baixo" },
  { value: "above", label: "Acima do estoque baixo" },
  { value: "high", label: "Estoque alto" },
  { value: "out", label: "Sem estoque" },
  { value: "unknown", label: "Não informado" },
] as const;

export function ProductFilters({
  query,
  sortable,
}: {
  query: AdminQuery;
  sortable: boolean;
}) {
  const [stock, setStock] = useState(query.stock);
  useEffect(() => setStock(query.stock), [query.stock]);
  return (
    <>
      <HeaderFilterGroup label="Categoria" activeValue={query.category}>
        <label className="workspace-filter-label">
          Categoria
          <input
            className="admin-filter-input"
            name="category"
            maxLength={200}
            defaultValue={query.category}
            placeholder="Buscar categoria"
            aria-label="Filtrar categoria"
          />
        </label>
      </HeaderFilterGroup>
      <HeaderFilterGroup label="Marca" activeValue={query.vendor}>
        <label className="workspace-filter-label">
          Marca
          <input
            className="admin-filter-input"
            name="vendor"
            maxLength={200}
            defaultValue={query.vendor}
            placeholder="Buscar marca"
            aria-label="Filtrar marca"
          />
        </label>
      </HeaderFilterGroup>
      {query.offers === "1" && <input type="hidden" name="offers" value="1" />}
      <HeaderFilterGroup
        label="Estoque"
        activeValue={
          stock === "all"
            ? undefined
            : stockOptions.find((option) => option.value === stock)?.label
        }
      >
        <div className="header-filter-options">
          {stockOptions.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="stock"
                value={option.value}
                checked={stock === option.value}
                onChange={() => setStock(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </HeaderFilterGroup>
      {sortable && <ProductOrder sort={query.sort} />}
    </>
  );
}

const orderOptions = [
  { value: "updated_desc", label: "Mais recentes" },
  { value: "updated_asc", label: "Mais antigos" },
  { value: "name_asc", label: "Nome de A a Z" },
] as const;

function ProductOrder({ sort }: { sort: AdminQuery["sort"] }) {
  const [value, setValue] = useState(sort);
  useEffect(() => setValue(sort), [sort]);
  return (
    <HeaderFilterGroup
      label="Ordenação"
      activeValue={
        value === "updated_desc"
          ? undefined
          : orderOptions.find((option) => option.value === value)?.label
      }
    >
      <div
        className="header-filter-options"
        role="group"
        aria-label="Ordenar ofertas"
      >
        {orderOptions.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="sort"
              value={option.value}
              checked={value === option.value}
              onChange={() => setValue(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <small>Última atualização do produto na Shopify</small>
    </HeaderFilterGroup>
  );
}

const updatedDateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function ProductList({
  products,
  settings,
  search,
  resetKey,
  showUpdatedAt = false,
}: {
  products: AdminProduct[];
  search: string;
  resetKey: string;
  showUpdatedAt?: boolean;
  settings: { low: number; high: number };
}) {
  return (
    <>
      <DragScroll
        className="admin-table-scroll finance-table-viewport admin-product-viewport"
        label="Resultados de produtos"
        resetKey={resetKey}
      >
        <table className="admin-table">
          <colgroup>
            <col className="admin-product-column" />
            <col span={5} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <div className="admin-product-column-heading">
                  <span>Produto</span>
                  <label className="admin-filter-search">
                    <Search size={16} aria-hidden="true" />
                    <input
                      type="search"
                      name="q"
                      defaultValue={search}
                      maxLength={120}
                      placeholder="Buscar por nome ou SKU"
                      aria-label="Buscar produto por nome ou SKU"
                    />
                  </label>
                </div>
              </th>
              <th scope="col">Categoria / marca</th>
              <th scope="col">Preço</th>
              <th scope="col">Estoque</th>
              <th scope="col">Situação</th>
              <th scope="col">
                <span className="admin-sr-only">Link</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const updated = p.updatedAt ? new Date(p.updatedAt) : null;
              const validDate = updated && Number.isFinite(updated.getTime());
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
                        {showUpdatedAt && (
                          <small className="admin-product-updated">
                            {validDate ? (
                              <time
                                dateTime={updated.toISOString()}
                                title="Última atualização do produto na Shopify · Horário de Brasília"
                              >
                                Alterado em {updatedDateFormat.format(updated)}{" "}
                                · Brasília
                              </time>
                            ) : (
                              "Última alteração não informada"
                            )}
                          </small>
                        )}
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
      </DragScroll>
      {products.length === 0 && (
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
    </>
  );
}
