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
import AdminSelect from "./AdminSelect";
import SalesStatusSelect from "./SalesStatusSelect";
import DeliveryMark from "./DeliveryMark";

export default function SalesFilterPanel({
  filters,
  categoryDraft,
  onCategoryChange,
  onChange,
  finance,
  deliveries,
}: {
  filters: SalesFilters;
  categoryDraft: string;
  onCategoryChange: (value: string) => void;
  onChange: (value: Partial<SalesFilters>) => void;
  finance: boolean;
  deliveries?: { kind: string; orders: string }[];
}) {
  const hasFilters =
    (!finance &&
      (filters.status !== "all" ||
        (filters.fulfillment && filters.fulfillment !== "all"))) ||
    (filters.delivery && filters.delivery !== "all") ||
    filters.category ||
    categoryDraft;
  return (
    <section className="workspace-query-group" aria-label="Filtros de vendas">
      {!finance && (
        <>
          <SalesStatusSelect
            id="sales-status"
            triggerLabel="Pagamento"
            value={filters.status}
            onChange={(status) => onChange({ status })}
          />
          <AdminSelect
            id="sales-fulfillment"
            triggerLabel="Atendimento"
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
        </>
      )}
      <AdminSelect
        id="sales-delivery-filter"
        triggerLabel="Entrega"
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
                    deliveries.find((item) => item.kind === kind)?.orders || 0,
                  ),
                )
              : undefined,
          })),
        ]}
      />
      <HeaderFilterGroup
        inline
        label="Categoria do produto"
        activeCount={filters.category ? 1 : 0}
        activeValue={filters.category}
      >
        <label htmlFor="sales-category" className="admin-sr-only">
          Categoria do produto
        </label>
        <input
          id="sales-category"
          type="search"
          className="admin-filter-input"
          maxLength={200}
          value={categoryDraft}
          onChange={(event) => onCategoryChange(event.target.value)}
          placeholder="Ex.: balões, confeitaria…"
        />
      </HeaderFilterGroup>
      {hasFilters && (
        <button
          className="header-query-clear"
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
          <X size={14} aria-hidden="true" /> Limpar filtros
        </button>
      )}
    </section>
  );
}
