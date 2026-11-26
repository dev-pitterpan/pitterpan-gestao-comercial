"use client";
import WorkspaceQueryControls from "./WorkspaceQueryControls";
import { PageHeading } from "./Primitives";
import SalesFilterPanel from "./SalesFilterPanel";
import ShopifySummary from "./ShopifySummary";
import { fulfillmentLabels } from "../../lib/admin/fulfillment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SalesTrendChart, { salesTrendPoints } from "./SalesTrendChart";
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
import { ArrowUpRight, Package, RefreshCw, ShoppingCart } from "lucide-react";
import OrderCustomer from "./OrderCustomer";
import OrderCustomerRefresh from "./OrderCustomerRefresh";
import ShippingCharge from "./ShippingCharge";
import DeliveryMark from "./DeliveryMark";
import OrderProductPreview from "./OrderProductPreview";
import DragScroll from "./DragScroll";
import PitterSpinner from "./PitterSpinner";
import { shiftDate, todayDate } from "../../lib/admin/date-range";
import type { SalesFilters } from "../../server/sales/filters";
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
  title,
  description,
  initialFilters,
  initialDays = 30,
  view = "orders",
  netFirst = false,
}: {
  title: string;
  description: string;
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
          daily: finance || showSummary ? "1" : "0",
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
    [days, filters, finance, showSummary],
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
      <WorkspaceQueryControls>
        <SalesFilterPanel
          filters={filters}
          categoryDraft={categoryDraft}
          onCategoryChange={setCategoryDraft}
          finance={finance}
          deliveries={data?.deliveries}
          onChange={(patch) => {
            resetList();
            setFilters((old) => ({ ...old, ...patch }));
          }}
        />
      </WorkspaceQueryControls>
      <PageHeading
        eyebrow={
          finance
            ? "Módulo financeiro · Shopify"
            : showSummary
              ? "Visão geral · Shopify"
              : "Módulo de pedidos · Shopify"
        }
        title={title}
        description={description}
        navigationAction={
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
            {showSummary && (
              <button
                type="button"
                className="admin-button"
                onClick={sync}
                title="Processar a próxima etapa de importação dos pedidos"
                disabled={syncing}
              >
                <RefreshCw size={16} className={syncing ? "sales-spin" : ""} />
                {syncing ? "Sincronizando…" : "Atualizar pedidos"}
              </button>
            )}
          </div>
        }
      />
      {finance && (
        <details className="sales-methodology">
          <summary>Como os valores são calculados</summary>
          <p className="sales-definition">
            Pedidos processados no período, com o estado financeiro atual.
            Estornos são os valores acumulados desses pedidos e podem ter
            ocorrido depois do período selecionado. Recebimentos incluem frete e
            impostos; não são uma apuração contábil por data de pagamento.
            Pedidos de teste são excluídos.
            {filters.category &&
              " Os valores são dos pedidos completos que contêm produtos dessa categoria na última importação; o ranking inclui somente os produtos correspondentes."}
          </p>
        </details>
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
          {data.state?.until_at && (
            <p className="admin-inline-note">
              Importação em andamento: os indicadores representam apenas os
              pedidos já processados. Continue a atualização para completar a
              janela.
            </p>
          )}
          {showSummary && (
            <ShopifySummary
              data={data}
              params={linkParams}
              start={chartStart}
              end={chartEnd}
              loading={loading}
            />
          )}
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
          {finance && (
            <section className="admin-panel sales-finance-panel">
              {data.totals.map((total, index) => {
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
                  <SalesTrendChart
                    key={total.currency}
                    title={
                      view === "refunds"
                        ? "Evolução dos reembolsos"
                        : "Evolução dos recebimentos"
                    }
                    label={chartLabel}
                    total={money(total[chartMetric], total.currency)}
                    rows={salesTrendPoints(
                      chartDates.map(
                        (day) =>
                          byDay.get(day) ?? {
                            day,
                            [chartMetric]:
                              day < completedDay && day >= automaticStart
                                ? "0"
                                : null,
                          },
                      ),
                      chartMetric,
                    )}
                    format={(value) => money(String(value), total.currency)}
                    refunds={view === "refunds"}
                    controls={
                      view === "receipts" && index === 0 ? (
                        <div
                          className="sales-trend-segments"
                          role="group"
                          aria-label="Indicador financeiro"
                        >
                          <button
                            type="button"
                            aria-pressed={metric === "received"}
                            onClick={() => setMetric("received")}
                          >
                            Recebido
                          </button>
                          <button
                            type="button"
                            aria-pressed={metric === "net"}
                            onClick={() => setMetric("net")}
                          >
                            Líquido
                          </button>
                        </div>
                      ) : undefined
                    }
                  />
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
              <div className="sales-orders-tools">
                <OrderCustomerRefresh
                  orders={data.orders}
                  onUpdate={updateCustomers}
                />
              </div>
              {loading && <small role="status">Atualizando pedidos…</small>}
              <DragScroll key={pageCursors.at(-1) || "first"}>
                <table
                  aria-busy={loading || moreLoading}
                  className="admin-table"
                >
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Produtos</th>
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
                        <td colSpan={finance ? 7 : 9}>
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
                          <OrderFulfillmentDetails
                            id={o.id}
                            name={o.name}
                            storedStatus={o.fulfillment_status}
                          />
                        </td>
                        <td className="order-products-cell">
                          <OrderProductPreview
                            products={data.orderPreviews[o.id]?.products ?? []}
                            itemCount={
                              data.orderPreviews[o.id]?.item_count ?? "0"
                            }
                            units={data.orderPreviews[o.id]?.units ?? "0"}
                          />
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
