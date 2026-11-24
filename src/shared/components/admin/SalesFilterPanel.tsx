"use client";
import { useId, useState, useRef } from "react";
import {
  SlidersHorizontal,
  X,
  CreditCard,
  PackageCheck,
  Truck,
  Tags,
  ChevronDown,
} from "lucide-react";
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
import OrderStatusSearch from "./OrderStatusSearch";
import DeliveryMark from "./DeliveryMark";

type Group = "payment" | "fulfillment" | "delivery" | "product";
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
  const id = useId(),
    [open, setOpen] = useState(false),
    [group, setGroup] = useState<Group>(finance ? "delivery" : "payment");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const groups = [
    ...(!finance
      ? [
          { id: "payment" as const, label: "Pagamento", icon: CreditCard },
          {
            id: "fulfillment" as const,
            label: "Atendimento",
            icon: PackageCheck,
          },
        ]
      : []),
    { id: "delivery" as const, label: "Entrega", icon: Truck },
    { id: "product" as const, label: "Produto", icon: Tags },
  ];
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
    <section className="content-sales-filters" aria-label="Filtros de vendas">
      <div className="content-filter-bar">
        <button
          id={`${id}-trigger`}
          className="content-filter-trigger"
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-filters`}
          onClick={() => setOpen(!open)}
        >
          <SlidersHorizontal size={16} />
          Refinar consulta{active.length > 0 && <b>{active.length}</b>}
          <ChevronDown size={15} />
        </button>
        <div
          className="content-active-filters"
          aria-label="Critérios aplicados"
        >
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
            <span>Todos os resultados do período selecionado</span>
          )}
        </div>
        {active.length > 0 && (
          <button
            className="content-clear-filters"
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
      <div
        id={`${id}-filters`}
        className="content-filter-workspace"
        hidden={!open}
      >
        <div
          className="content-filter-groups"
          role="tablist"
          aria-label="Assuntos dos filtros"
        >
          {groups.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                role="tab"
                aria-selected={group === item.id}
                aria-controls={`${id}-${item.id}-panel`}
                id={`${id}-${item.id}-tab`}
                tabIndex={group === item.id ? 0 : -1}
                onClick={() => setGroup(item.id)}
                onKeyDown={(event) => {
                  let next = index;
                  if (event.key === "ArrowRight")
                    next = (index + 1) % groups.length;
                  else if (event.key === "ArrowLeft")
                    next = (index + groups.length - 1) % groups.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = groups.length - 1;
                  else return;
                  event.preventDefault();
                  setGroup(groups[next].id);
                  tabs.current[next]?.focus();
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
        {!finance && (
          <div
            className="content-filter-fields"
            role="tabpanel"
            id={`${id}-payment-panel`}
            aria-labelledby={`${id}-payment-tab`}
            hidden={group !== "payment"}
          >
            <div>
              <label htmlFor="sales-status">Situação do pagamento</label>
              <SalesStatusSelect
                id="sales-status"
                value={filters.status}
                onChange={(status) => onChange({ status })}
              />
            </div>
            <div className="content-status-search">
              <label htmlFor="recent-orders-status">
                Ou procure uma situação
              </label>
              <OrderStatusSearch
                value={filters.status}
                onChange={(status) => onChange({ status })}
              />
            </div>
          </div>
        )}
        {!finance && (
          <div
            className="content-filter-fields"
            role="tabpanel"
            id={`${id}-fulfillment-panel`}
            aria-labelledby={`${id}-fulfillment-tab`}
            hidden={group !== "fulfillment"}
          >
            <div>
              <label htmlFor="sales-fulfillment">Situação do atendimento</label>
              <AdminSelect
                id="sales-fulfillment"
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
            <p>Separe pedidos em preparo, entregues ou aguardando retirada.</p>
          </div>
        )}
        <div
          className="content-filter-fields"
          role="tabpanel"
          id={`${id}-delivery-panel`}
          aria-labelledby={`${id}-delivery-tab`}
          hidden={group !== "delivery"}
        >
          <div>
            <label htmlFor="sales-delivery-filter">Modalidade de entrega</label>
            <AdminSelect
              id="sales-delivery-filter"
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
                          deliveries.find((item) => item.kind === kind)
                            ?.orders || 0,
                        ),
                      )
                    : undefined,
                })),
              ]}
            />
          </div>
          <p>Consulte as modalidades registradas nos pedidos da sua seleção.</p>
        </div>
        <div
          className="content-filter-fields"
          role="tabpanel"
          id={`${id}-product-panel`}
          aria-labelledby={`${id}-product-tab`}
          hidden={group !== "product"}
        >
          <div>
            <label htmlFor="sales-category">Categoria do produto</label>
            <input
              id="sales-category"
              type="search"
              maxLength={200}
              value={categoryDraft}
              onChange={(event) => onCategoryChange(event.target.value)}
              placeholder="Ex.: balões, confeitaria…"
            />
          </div>
          <p>
            Mostra pedidos que contêm produtos da categoria na última
            importação.
          </p>
        </div>
        <footer>
          <span>Os filtros são combinados e aplicados automaticamente.</span>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              document.getElementById(`${id}-trigger`)?.focus();
            }}
          >
            Concluir <X size={13} />
          </button>
        </footer>
      </div>
    </section>
  );
}
