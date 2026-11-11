"use client";
import {
  fulfillmentLabels,
  fulfillmentFilters,
  fulfillmentFilterLabels,
  type FulfillmentFilter,
} from "../../lib/admin/fulfillment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RevenueChart } from "./AnalyticsCharts";
import type { SalesView } from "./SalesWorkspace";
import {
  salesPageLink,
  SALES_PAGE_SIZE,
  salesSectionFromHash,
} from "../../lib/admin/sales-links";
import TablePagination from "./TablePagination";
import OrderFulfillmentDetails from "./OrderFulfillmentDetails";
import SalesOperations from "./SalesOperations";
import SoldProductsHistory from "./SoldProductsHistory";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import OrderStatusSearch from "./OrderStatusSearch";
import SalesStatusSelect from "./SalesStatusSelect";
import OrderCustomer from "./OrderCustomer";
import OrderCustomerRefresh from "./OrderCustomerRefresh";
import ShippingCharge from "./ShippingCharge";
import DeliveryMark from "./DeliveryMark";
import DragScroll from "./DragScroll";
import {
  deliveryFilterKinds,
  deliveryLabels,
  type DeliveryKind,
} from "../../lib/admin/delivery";
import PitterSpinner from "./PitterSpinner";
import { shiftDate, todayDate } from "../../lib/admin/date-range";
import type { SalesFilters } from "../../server/sales/filters";
import AdminSelect from "./AdminSelect";
import DateRangePicker from "./DateRangePicker";
import type { readSales } from "../../server/sales/repository";
type Data = Awaited<ReturnType<typeof readSales>>;
const count = (n: string | number) =>
  new Intl.NumberFormat("pt-BR").format(Number(n));
const money = (value: string, currency: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
    Number(value),
  );
const status: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  AUTHORIZED: "Autorizado",
  PARTIALLY_PAID: "Parcialmente pago",
  PARTIALLY_REFUNDED: "Reembolso parcial",
  REFUNDED: "Reembolsado",
  VOIDED: "Anulado",
  EXPIRED: "Expirado",
  UNKNOWN: "Não informado",
};
export default function SalesDashboard({
  initialFilters,
  initialDays = 30,
  view = "orders",
  netFirst = false,
}: {
  initialFilters?: SalesFilters;
  initialDays?: number;
  view?: SalesView;
  netFirst?: boolean;
}) {
  const router = useRouter();
  const initialOperations = view === "operations";
  const showSummary = view === "summary";
  const productsOnly = view === "products";
  const finance = view === "receipts" || view === "refunds";
  const [metric, setMetric] = useState<"received" | "net">(
    netFirst ? "net" : "received",
  );
  const [filters, setFilters] = useState<SalesFilters>(
    initialFilters || {
      status: "all",
      category: "",
      delivery: "all",
    },
  );
  const [categoryDraft, setCategoryDraft] = useState(
    initialFilters?.category || "",
  );
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreError, setMoreError] = useState("");
  const generation = useRef(0);
  const paged = useRef(false);
  const [pageCursors, setPageCursors] = useState([""]);
  const moreBusy = useRef(false);
  const [days, setDays] = useState(initialDays),
    [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [syncing, setSyncing] = useState(false),
    [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const entryPositioned = useRef(false);
  useEffect(() => {
    if (entryPositioned.current) return;
    const section = salesSectionFromHash(window.location.hash);
    if (
      view === "orders" &&
      (section === "sold-products" || section === "sales-operations")
    ) {
      const path =
        section === "sold-products"
          ? "/gestor/produtos-vendidos/"
          : "/gestor/vendas/atendimento/";
      router.replace(
        salesPageLink(path, new URLSearchParams(window.location.search)),
      );
      return;
    }
    if (section === "recent-orders" && view === "orders") {
      if (!data) return;
      const target = document.getElementById(section);
      if (!target) return;
      target.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    entryPositioned.current = true;
  }, [data, router, view]);
  const updateCustomers = useCallback((rows: Record<string, string>[]) => {
    const byId = new Map(rows.map((row) => [row.id, row]));
    setData((old) =>
      old
        ? {
            ...old,
            orders: old.orders.map((order) => ({
              ...order,
              ...byId.get(order.id),
            })),
          }
        : old,
    );
  }, []);
  const fetching = useRef(0);
  const resetList = (preserveData = false) => {
    generation.current++;
    paged.current = false;
    setPageCursors([""]);
    if (!preserveData) setData(null);
    setLoading(true);
    setMoreLoading(false);
    moreBusy.current = false;
    setMoreError("");
    setError("");
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      const category = categoryDraft.trim();
      if (category !== filters.category) {
        resetList();
        setFilters((old) => ({ ...old, category }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [categoryDraft, filters.category]);
  useEffect(() => {
    const url = new URL(window.location.href);
    const values = {
      days: days === 30 ? "" : String(days),
      start: filters.start,
      end: filters.end,
      status: filters.status === "all" ? "" : filters.status,
      fulfillment:
        filters.fulfillment === "all" && !initialOperations
          ? ""
          : filters.fulfillment,
      category: filters.category,
      delivery: filters.delivery === "all" ? "" : filters.delivery,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href !== window.location.href)
      window.history.replaceState(null, "", url);
  }, [days, filters, initialOperations]);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const requestId = ++fetching.current;
      const epoch = generation.current;
      try {
        const params = new URLSearchParams({
          days: String(days),
          ranking: "0",
          daily: finance ? "1" : "0",
          start: filters.start || "",
          end: filters.end || "",
          status: filters.status,
          fulfillment: filters.fulfillment || "all",
          category: filters.category,
          delivery: filters.delivery || "all",
        });
        const url = `/api/admin/sales/?${params}`;
        const response = await fetch(url, {
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
            : AbortSignal.timeout(20000),
          cache: "no-store",
        });
        const body = await response.json();
        if (
          signal?.aborted ||
          requestId !== fetching.current ||
          epoch !== generation.current
        )
          return;
        if (!response.ok)
          throw new Error(
            body.error || "Não foi possível consultar as vendas.",
          );
        const next = body as Data;
        setData(next);
        setError("");
      } catch (err) {
        if (
          requestId === fetching.current &&
          epoch === generation.current &&
          !signal?.aborted &&
          !(err instanceof Error && err.name === "AbortError")
        )
          setError(err instanceof Error ? err.message : "Falha na consulta.");
      } finally {
        if (requestId === fetching.current && epoch === generation.current)
          setLoading(false);
      }
    },
    [days, filters, finance],
  );
  useEffect(() => {
    if (productsOnly) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void load(controller.signal);
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !paged.current &&
        !moreBusy.current
      )
        void load(controller.signal);
    }, 30000);
    return () => {
      generation.current++;
      controller.abort();
      clearInterval(timer);
    };
  }, [load, revision, productsOnly]);
  async function changePage(direction: -1 | 1) {
    if (loading || !data || moreBusy.current) return;
    const nextCursor = data.nextCursor;
    if (direction === 1 ? !nextCursor : pageCursors.length === 1) return;
    const cursors =
      direction === 1
        ? [...pageCursors, nextCursor!]
        : pageCursors.slice(0, -1);
    const cursor = cursors.at(-1) || "";

    const epoch = generation.current;
    moreBusy.current = true;
    setMoreLoading(true);
    setMoreError("");
    fetching.current++;
    try {
      const params = new URLSearchParams({
        view: "orders",
        days: String(days),
        start: filters.start || "",
        end: filters.end || "",
        status: filters.status,
        fulfillment: filters.fulfillment || "all",
        category: filters.category,
        delivery: filters.delivery || "all",
        orderCursor: cursor,
      });
      const response = await fetch(`/api/admin/sales/?${params}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      const body = await response.json();
      if (epoch !== generation.current) return;
      if (!response.ok)
        throw new Error(
          body.error || "Não foi possível abrir esta página de pedidos.",
        );
      const page = body as Pick<Data, "orders" | "hasMore" | "nextCursor">;
      setData((current) => (current ? { ...current, ...page } : current));
      setPageCursors(cursors);
      paged.current = cursors.length > 1;
      document
        .getElementById("recent-orders")
        ?.scrollIntoView({ block: "nearest" });
    } catch (error) {
      if (epoch === generation.current)
        setMoreError(
          error instanceof Error
            ? error.message
            : "Falha ao abrir a página de pedidos.",
        );
    } finally {
      if (epoch === generation.current) {
        moreBusy.current = false;
        setMoreLoading(false);
      }
    }
  }
  async function sync() {
    setSyncing(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/sales/", { method: "POST" });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Já existe uma atualização em andamento.",
        );
      setMessage(
        result.more
          ? "Etapa concluída. Há mais pedidos ou eventos; clique novamente para continuar, ou deixe o agendamento processar."
          : "Atualização concluída.",
      );
      resetList();
      setRevision((n) => n + 1);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível atualizar.",
      );
    } finally {
      setSyncing(false);
    }
  }
  const operations = data ? (
    <SalesOperations
      queue={initialOperations}
      params={new URLSearchParams({
        days: String(days),
        start: filters.start || "",
        end: filters.end || "",
        status: filters.status,
        fulfillment: filters.fulfillment || "all",
        delivery: filters.delivery || "all",
        category: filters.category,
        revision: String(revision),
        snapshot: data.state?.completed_at || "",
        webhook: data.state?.last_webhook_at || "",
        cursor: data.cursor,
      }).toString()}
    />
  ) : null;
  const automaticStart = shiftDate(todayDate(), -59);
  const outsideAutomaticWindow =
    !!filters.start && filters.start < automaticStart;
  const linkParams = new URLSearchParams({
    days: String(days),
    start: filters.start || "",
    end: filters.end || "",
    category: filters.category,
    delivery: filters.delivery || "all",
    fulfillment: filters.fulfillment || "all",
    status: filters.status,
  });
  const ordersPath = "/gestor/vendas/";
  const receiptsPath = "/gestor/vendas/recebimentos/";
  const refundsPath = "/gestor/vendas/reembolsos/";
  const chartEnd = filters.end || todayDate();
  const chartStart = filters.start || shiftDate(chartEnd, 1 - days);
  const chartDates: string[] = [];
  if (finance) {
    for (
      let date = chartStart;
      date <= chartEnd && chartDates.length < 366;
      date = shiftDate(date, 1)
    ) {
      chartDates.push(date);
    }
  }
  const chartMetric = view === "refunds" ? "refunded" : metric;
  const chartLabel =
    view === "refunds"
      ? "Valor reembolsado"
      : metric === "net"
        ? "Líquido após estornos"
        : "Recebido confirmado";
  return (
    <div className="sales-dashboard">
      <div className="sales-toolbar">
        <div className="sales-period-field">
          <span className="sales-period-label">Período dos pedidos</span>
          <DateRangePicker
            value={{ start: chartStart, end: chartEnd }}
            resetLabel="Voltar aos últimos 30 dias"
            onChange={(range) => {
              resetList();
              if (!range.start) setDays(30);
              setFilters((old) => ({ ...old, ...range }));
            }}
          />
        </div>
        {!finance && !showSummary && (
          <div>
            <label htmlFor="sales-status">Situação do pagamento</label>
            <SalesStatusSelect
              id="sales-status"
              value={filters.status}
              onChange={(status) => {
                resetList();
                setFilters((old) => ({ ...old, status }));
              }}
            />
          </div>
        )}
        {!finance && !showSummary && (
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
              onValueChange={(fulfillment) => {
                resetList();
                setFilters((old) => ({
                  ...old,
                  fulfillment: fulfillment as FulfillmentFilter,
                }));
              }}
            />
          </div>
        )}
        {!showSummary && (
          <div>
            <label htmlFor="sales-delivery-filter">Modalidade de entrega</label>
            <AdminSelect
              id="sales-delivery-filter"
              label="Modalidade de entrega"
              value={filters.delivery || "all"}
              onValueChange={(delivery) => {
                resetList();
                setFilters((old) => ({
                  ...old,
                  delivery: delivery as DeliveryKind | "all",
                }));
              }}
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
                  count: data
                    ? count(
                        data.deliveries.find((item) => item.kind === kind)
                          ?.orders ?? 0,
                      )
                    : undefined,
                })),
              ]}
            />
          </div>
        )}
        {!showSummary && (
          <div className="sales-category-filter">
            <label htmlFor="sales-category">Categoria do produto</label>
            <input
              id="sales-category"
              type="search"
              maxLength={200}
              value={categoryDraft}
              onChange={(event) => setCategoryDraft(event.target.value)}
              placeholder="Buscar qualquer categoria…"
            />
          </div>
        )}
        {showSummary && (
          <button
            type="button"
            className="admin-button"
            onClick={sync}
            disabled={syncing}
          >
            <RefreshCw size={16} className={syncing ? "sales-spin" : ""} />
            {syncing ? "Atualizando…" : "Atualizar uma etapa"}
          </button>
        )}
      </div>
      {(finance || showSummary) && (
        <p className="sales-definition">
          Pedidos processados no período, com o estado financeiro atual.
          Estornos são os valores acumulados desses pedidos e podem ter ocorrido
          depois do período selecionado. Recebimentos incluem frete e impostos;
          não são uma apuração contábil por data de pagamento. Pedidos de teste
          são excluídos.
          {filters.category &&
            " Os valores são dos pedidos completos que contêm produtos dessa categoria na última importação; o ranking inclui somente os produtos correspondentes."}
        </p>
      )}
      {outsideAutomaticWindow && (
        <p className="admin-data-notice" role="status">
          Este período inclui datas anteriores à janela automática de 60 dias.
          Os totais consideram somente pedidos já importados e podem estar
          incompletos.
        </p>
      )}
      {error && (
        <p className="admin-data-notice" role="status">
          {error}
          {data &&
            " Os últimos dados carregados continuam abaixo e podem estar desatualizados."}
        </p>
      )}
      {message && (
        <p className="admin-inline-note" role="status">
          {message}
        </p>
      )}
      {productsOnly && <SoldProductsHistory filters={filters} days={days} />}
      {!productsOnly && loading && !data && (
        <div className="admin-panel" role="status">
          <PitterSpinner label="Consultando vendas…" />
        </div>
      )}
      {data && (
        <>
          {initialOperations && operations}
          {data.failed > 0 && (
            <p className="admin-data-notice" role="status">
              {data.failed} eventos precisam de revisão após dez tentativas. A
              importação dos demais pedidos continua funcionando.
            </p>
          )}
          {showSummary && (
            <div className="sales-health">
              <span>
                <BadgeCheck size={16} />{" "}
                {data.state?.completed_at
                  ? `Última conferência: ${new Date(data.state.completed_at).toLocaleString("pt-BR")}`
                  : "Importação inicial ainda não concluída"}
              </span>
              <span>{data.pending} eventos aguardando processamento</span>
              {data.oldestPendingAt && (
                <span>
                  Evento mais antigo na fila:{" "}
                  {new Date(data.oldestPendingAt).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}
                </span>
              )}
            </div>
          )}
          {data.state?.until_at && (
            <p className="admin-inline-note">
              Importação em andamento: os indicadores representam apenas os
              pedidos já processados. Continue a atualização para completar a
              janela.
            </p>
          )}
          {showSummary &&
            data.totals.map((t) => (
              <section
                key={t.currency}
                aria-label={`Indicadores em ${t.currency}`}
              >
                <div className="sales-currency">
                  MOEDA DA LOJA · {t.currency}
                </div>
                <div className="sales-stats">
                  <Link
                    href={salesPageLink(receiptsPath, linkParams, {
                      metric: "net",
                    })}
                    className="sales-metric sales-metric--hero sales-metric-link"
                  >
                    <span>
                      <CircleDollarSign size={19} aria-hidden="true" /> Líquido
                      após estornos
                    </span>
                    <strong>{money(t.net, t.currency)}</strong>
                    <small>Recebido menos reembolsado</small>
                  </Link>
                  {[
                    {
                      label: "Recebido confirmado",
                      tone: "received",
                      href: salesPageLink(receiptsPath, linkParams),
                      value: money(t.received, t.currency),
                      detail: "Valores recebidos informados pela Shopify",
                      icon: CircleDollarSign,
                    },
                    {
                      label: "Pagos não cancelados",
                      tone: "paid",
                      href: salesPageLink(ordersPath, linkParams, {
                        status: "PAID_ACTIVE",
                      }),
                      value: count(t.paid),
                      detail: `${money(t.paid_value, t.currency)} em pedidos pagos e não cancelados`,
                      icon: ShoppingCart,
                    },
                    {
                      label: "Ticket dos pedidos pagos",
                      tone: "ticket",
                      href: salesPageLink(ordersPath, linkParams, {
                        status: "PAID_ACTIVE",
                      }),
                      value: money(t.ticket, t.currency),
                      detail: "Total médio dos pedidos com status pago",
                      icon: ArrowUpRight,
                    },
                    {
                      label: "Estornos / reembolsos",
                      tone: "refunds",
                      href: salesPageLink(refundsPath, linkParams),
                      value: money(t.refunded, t.currency),
                      detail: `${count(t.refunded_orders)} pedidos com reembolso total ou parcial`,
                      icon: ArrowDownLeft,
                    },
                  ].map(({ label, value, detail, icon: Icon, tone, href }) => (
                    <Link
                      href={href}
                      className={`sales-metric sales-metric--${tone} sales-metric-link`}
                      key={label}
                    >
                      <span>
                        <Icon size={16} aria-hidden="true" /> {label}
                      </span>
                      <strong>{value}</strong>
                      <small>{detail}</small>
                    </Link>
                  ))}
                </div>
                <h3 className="sales-status-heading">Situação dos pedidos</h3>
                <div className="sales-status-values">
                  {[
                    {
                      label: Number(t.outstanding_estimated)
                        ? "Saldo não pago (parte calculada)"
                        : "Saldo não pago · Shopify",
                      count: t.pending,
                      value: t.outstanding,
                      status: "OPEN_BALANCE",
                    },
                    {
                      label: "Expirados",
                      count: t.expired,
                      value: t.expired_value,
                      status: "EXPIRED",
                    },
                    {
                      label: "Anulados",
                      count: t.voided,
                      value: t.voided_value,
                      status: "VOIDED",
                    },
                    {
                      label: "Cancelados",
                      count: t.cancelled,
                      value: t.cancelled_value,
                      status: "CANCELLED",
                    },
                  ].map((s) => (
                    <Link
                      key={s.status}
                      data-status={s.status}
                      href={salesPageLink(ordersPath, linkParams, {
                        status: s.status,
                      })}
                    >
                      <span>
                        {s.label} · {count(s.count)}
                      </span>
                      <strong>{money(s.value, t.currency)}</strong>
                    </Link>
                  ))}
                </div>
                {Number(t.inconsistent) > 0 && (
                  <p className="admin-data-notice">
                    Há {t.inconsistent} pedidos com divergência entre os campos
                    financeiros da Shopify. O líquido exibido usa recebido menos
                    estornado; sincronize para conferir.
                  </p>
                )}
                <p className="sales-definition">
                  {count(t.pending)} pedidos aguardando pagamento/conclusão ·{" "}
                  {count(t.cancelled)} cancelados. Expirados e anulados mostram
                  o valor dos pedidos, não dinheiro recebido. Cancelamentos são
                  uma situação independente do pagamento: não some esses
                  quadros.
                </p>
              </section>
            ))}
          {showSummary && !data.totals.length && (
            <div className="admin-panel sales-empty">
              <Package size={36} />
              <h2>Nenhum pedido no período</h2>
              <p>
                Nenhum pedido importado corresponde ao período e aos filtros
                escolhidos. Experimente outra situação, categoria ou período.
              </p>
            </div>
          )}
          {showSummary && (
            <nav className="sales-workspace-links" aria-label="Telas de vendas">
              <Link
                className="admin-button"
                href={salesPageLink(ordersPath, linkParams)}
              >
                Pedidos recentes <ArrowUpRight size={15} />
              </Link>
              <Link
                className="admin-button"
                href={salesPageLink("/gestor/vendas/atendimento/", linkParams)}
              >
                Atendimento de pedidos <ArrowUpRight size={15} />
              </Link>
              <Link
                className="admin-button"
                href={salesPageLink("/gestor/produtos-vendidos/", linkParams)}
              >
                Produtos mais vendidos <ArrowUpRight size={15} />
              </Link>
            </nav>
          )}
          {finance && (
            <section className="admin-panel sales-finance-panel">
              <header>
                <h2>Evolução por data do pedido</h2>
              </header>
              {view === "receipts" && (
                <div
                  className="sales-workspace-links sales-finance-switch"
                  role="group"
                  aria-label="Indicador financeiro"
                >
                  <button
                    type="button"
                    className="admin-button"
                    aria-pressed={metric === "received"}
                    onClick={() => setMetric("received")}
                  >
                    Recebido confirmado
                  </button>
                  <button
                    type="button"
                    className="admin-button"
                    aria-pressed={metric === "net"}
                    onClick={() => setMetric("net")}
                  >
                    Líquido após estornos
                  </button>
                </div>
              )}
              {data.totals.map((total) => {
                const byDay = new Map(
                  data.daily
                    .filter((row) => row.currency === total.currency)
                    .map((row) => [row.day, row]),
                );
                const completedDay =
                  data.state?.completed_at && !data.state.until_at
                    ? todayDate(
                        "America/Sao_Paulo",
                        new Date(data.state.completed_at),
                      )
                    : "";
                return (
                  <div key={total.currency} className="sales-finance-series">
                    <p>
                      <strong>
                        {chartLabel} ·{" "}
                        {money(total[chartMetric], total.currency)}
                      </strong>
                    </p>
                    <RevenueChart
                      key={`${total.currency}-${chartMetric}`}
                      table={{
                        columns: [],
                        rows: chartDates.map(
                          (day) =>
                            byDay.get(day) ?? {
                              day,
                              [chartMetric]:
                                day < completedDay && day >= automaticStart
                                  ? "0"
                                  : null,
                            },
                        ),
                      }}
                      currency={total.currency}
                      showTable={false}
                      compact
                      metricKey={chartMetric}
                      metricLabel={chartLabel}
                      axisLabel={total.currency}
                      money={(value) =>
                        value === null
                          ? "—"
                          : money(String(value), total.currency)
                      }
                    />
                  </div>
                );
              })}
              {!data.totals.length && (
                <p>Nenhum movimento encontrado no período.</p>
              )}
            </section>
          )}
          {(view === "orders" || finance) && (
            <section
              id="recent-orders"
              className="admin-panel sales-orders-panel"
            >
              <header>
                <h2>
                  {finance
                    ? "Pedidos que compõem o resultado"
                    : "Pedidos recentes"}
                </h2>
                <ShoppingCart size={22} />
              </header>
              {!finance && (
                <div className="sales-orders-status-filter">
                  <label htmlFor="recent-orders-status">
                    Buscar pagamento ou cancelamento
                  </label>
                  <OrderStatusSearch
                    value={filters.status}
                    onChange={(status) => {
                      resetList(true);
                      setFilters((old) => ({ ...old, status }));
                    }}
                  />
                  <small>Combina com período, categoria e entrega.</small>
                  {filters.status === "REFUNDS" && (
                    <small>
                      Inclui estornos totais e parciais com valor reembolsado,
                      mesmo em pedidos cancelados.
                    </small>
                  )}
                  {filters.status === "CANCELLED" && (
                    <small>
                      Inclui pedidos cancelados com ou sem reembolso. Confira as
                      colunas Recebido e Estornado.
                    </small>
                  )}
                </div>
              )}
              <OrderCustomerRefresh
                orders={data.orders}
                onUpdate={updateCustomers}
              />
              {loading && <small role="status">Atualizando pedidos…</small>}
              <DragScroll>
                <table
                  aria-busy={loading || moreLoading}
                  className="admin-table"
                >
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Situação</th>
                      {!finance && <th>Entrega escolhida</th>}
                      {!finance && <th>Total do pedido</th>}
                      <th>Recebido</th>
                      <th>Estornado</th>
                      <th>Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data.orders.length && (
                      <tr>
                        <td colSpan={finance ? 6 : 8}>
                          Nenhum pedido importado corresponde aos filtros
                          escolhidos.
                        </td>
                      </tr>
                    )}
                    {data.orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>{o.name}</strong>
                          <small>
                            <time
                              dateTime={new Date(o.processed_at).toISOString()}
                              title="Horário do pedido registrado na Shopify · Brasília"
                            >
                              {new Date(o.processed_at).toLocaleDateString(
                                "pt-BR",
                                { timeZone: "America/Sao_Paulo" },
                              )}
                              <br />
                              {new Date(o.processed_at).toLocaleTimeString(
                                "pt-BR",
                                {
                                  timeZone: "America/Sao_Paulo",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )}
                            </time>
                          </small>
                          {finance && (
                            <OrderFulfillmentDetails
                              id={o.id}
                              name={o.name}
                              storedStatus={o.fulfillment_status}
                            />
                          )}
                        </td>
                        <td>
                          <OrderCustomer order={o} />
                        </td>
                        <td>
                          <span
                            className={`admin-badge ${o.cancelled_at ? "rose" : o.financial_status === "PAID" ? "green" : "blue"}`}
                          >
                            {status[o.financial_status] || o.financial_status}
                          </span>
                          {o.cancelled_at && (
                            <small className="admin-badge rose">
                              Pedido cancelado
                            </small>
                          )}
                        </td>
                        {!finance && (
                          <>
                            <td>
                              <DeliveryMark kind={o.delivery_kind} />
                              <ShippingCharge order={o} />
                              {o.delivery_label &&
                                o.delivery_kind !== "LOCAL" &&
                                !(
                                  o.delivery_kind === "PAC" &&
                                  o.delivery_label.trim().toLowerCase() ===
                                    "envio normal (pac)"
                                ) && <small>{o.delivery_label}</small>}
                              <small>
                                {fulfillmentLabels[o.fulfillment_status] ||
                                  o.fulfillment_status}
                              </small>
                              <OrderFulfillmentDetails
                                id={o.id}
                                name={o.name}
                                storedStatus={o.fulfillment_status}
                              />
                            </td>
                            <td>
                              {money(o.total, o.currency)}
                              {o.current_total != null &&
                                Number(o.current_total) !== Number(o.total) && (
                                  <small className="sales-current-total">
                                    Atual: {money(o.current_total, o.currency)}
                                  </small>
                                )}
                            </td>
                          </>
                        )}
                        <td>{money(o.received, o.currency)}</td>
                        <td>{money(o.refunded, o.currency)}</td>
                        <td>{money(o.net, o.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DragScroll>
              {moreError && (
                <p className="admin-data-notice" role="alert">
                  {moreError}
                </p>
              )}
              <TablePagination
                label="Páginas de pedidos"
                page={pageCursors.length}
                range={
                  data.orders.length
                    ? `${(pageCursors.length - 1) * SALES_PAGE_SIZE + 1}–${(pageCursors.length - 1) * SALES_PAGE_SIZE + data.orders.length} pedidos`
                    : undefined
                }
                hasNext={data.hasMore}
                busy={moreLoading || loading}
                onPrevious={() => void changePage(-1)}
                onNext={() => void changePage(1)}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
