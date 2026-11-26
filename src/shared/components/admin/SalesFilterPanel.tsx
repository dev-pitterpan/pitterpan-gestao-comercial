"use client";
import { X } from "lucide-react";
import HeaderFilterGroup from "./HeaderFilterGroup";
import type { SalesFilters } from "../../server/sales/filters";
import {
  fulfillmentFilters,
  fulfillmentFilterLabels,
  type FulfillmentFilter,
} from "../../lib/admin/fulfillment";
import {
  deliveryFilterKinds,
  deliveryLabels,
  type DeliveryKind,
} from "../../lib/admin/delivery";
import { orderStatusSearchLabel } from "../../lib/admin/order-status-search";
import AdminSelect from "./AdminSelect";
import SalesStatusSelect from "./SalesStatusSelect";
import DeliveryMark from "./DeliveryMark";
import "../../styles/admin/query-filters.css";

export default function SalesFilterPanel({
  filters,
  categoryDraft,
  onCategoryChange,
  onChange,
  finance,
  deliveries,
  compact = false,
  categories = false,
}: {
  filters: SalesFilters;
  categoryDraft: string;
  onCategoryChange: (value: string) => void;
  onChange: (value: Partial<SalesFilters>) => void;
  finance: boolean;
  compact?: boolean;
  categories?: boolean;
  deliveries?: { kind: string; orders: string }[];
}) {
  const active = [
    ...(!finance && filters.status !== "all"
      ? [
          {
            key: "status" as const,
            label: `Pagamento: ${orderStatusSearchLabel(filters.status)}`,
          },
        ]
      : []),
    ...(!finance && filters.fulfillment && filters.fulfillment !== "all"
      ? [
          {
            key: "fulfillment" as const,
            label: `Atendimento: ${fulfillmentFilterLabels[filters.fulfillment]}`,
          },
        ]
      : []),
    ...(filters.delivery && filters.delivery !== "all"
      ? [
          {
            key: "delivery" as const,
            label: `Entrega: ${deliveryLabels[filters.delivery]}`,
          },
        ]
      : []),
    ...(filters.category
      ? [{ key: "category" as const, label: `Categoria: ${filters.category}` }]
      : []),
  ];
  function clear(key: "status" | "fulfillment" | "delivery" | "category") {
    if (key === "category") onCategoryChange("");
    onChange({ [key]: key === "category" ? "" : "all" });
  }

  return (
    <section
      className={`query-filters${compact ? " query-filters-compact" : ""}${categories ? " query-filters-categories" : ""}`}
      aria-label="Filtros de vendas"
    >
      {!compact && (
        <div className="query-filters-heading">
          <strong>Filtrar pedidos</strong>
          <span>
            Escolha uma opção. Os resultados atualizam automaticamente.
          </span>
        </div>
      )}
      <div
        className={`query-filters-grid${finance ? " query-filters-finance" : ""}`}
      >
        {!finance && (
          <>
            <div>
              <label htmlFor="sales-status">Pagamento</label>
              <SalesStatusSelect
                id="sales-status"
                triggerLabel={categories ? "Pagamento" : undefined}
                value={filters.status}
                onChange={(status) => onChange({ status })}
              />
            </div>
            <div>
              <label htmlFor="sales-fulfillment">Atendimento</label>
              <AdminSelect
                id="sales-fulfillment"
                triggerLabel={categories ? "Atendimento" : undefined}
                label="Situação do atendimento"
                value={filters.fulfillment || "all"}
                options={fulfillmentFilters.map((value) => ({
                  value,
                  label: fulfillmentFilterLabels[value],
                }))}
                onValueChange={(value) =>
                  onChange({ fulfillment: value as FulfillmentFilter })
                }
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="sales-delivery-filter">Entrega</label>
          <AdminSelect
            id="sales-delivery-filter"
            triggerLabel={categories ? "Entrega" : undefined}
            label="Modalidade de entrega"
            value={filters.delivery || "all"}
            onValueChange={(value) =>
              onChange({ delivery: value as DeliveryKind | "all" })
            }
            options={[
              { value: "all", label: "Todas as modalidades" },
              ...deliveryFilterKinds.map((kind) => ({
                value: kind,
                label: deliveryLabels[kind],
                icon: (
                  <span aria-hidden="true">
                    <DeliveryMark kind={kind} label={false} />
                  </span>
                ),
                count: deliveries
                  ? new Intl.NumberFormat("pt-BR").format(
                      Number(
                        deliveries.find((item) => item.kind === kind)?.orders ||
                          0,
                      ),
                    )
                  : undefined,
              })),
            ]}
          />
        </div>
        <div>
          {categories ? (
            <HeaderFilterGroup
              inline
              label="Categoria"
              activeCount={filters.category ? 1 : 0}
            >
              {" "}
              <label htmlFor="sales-category">Categoria do produto</label>
              <input
                id="sales-category"
                type="search"
                maxLength={200}
                value={categoryDraft}
                onChange={(event) => onCategoryChange(event.target.value)}
                placeholder="Ex.: balões, confeitaria…"
              />
            </HeaderFilterGroup>
          ) : (
            <>
              {" "}
              <label htmlFor="sales-category">Categoria do produto</label>
              <input
                id="sales-category"
                type="search"
                maxLength={200}
                value={categoryDraft}
                onChange={(event) => onCategoryChange(event.target.value)}
                placeholder="Ex.: balões, confeitaria…"
              />
            </>
          )}
        </div>
      </div>
      {(!compact || active.length > 0 || categoryDraft) && (
        <div className="query-filters-summary">
          <div className="query-filter-chips" aria-label="Critérios aplicados">
            {active.length ? (
              active.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => clear(item.key)}
                  aria-label={`Remover ${item.label}`}
                >
                  {item.label}
                  <X size={12} />
                </button>
              ))
            ) : (
              <span>Sem filtros adicionais · período mantido</span>
            )}
          </div>
          {(active.length > 0 || categoryDraft) && (
            <button
              className="query-filters-clear"
              type="button"
              onClick={() => {
                onCategoryChange("");
                onChange({
                  category: "",
                  delivery: "all",
                  ...(!finance ? { status: "all", fulfillment: "all" } : {}),
                });
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </section>
  );
}
