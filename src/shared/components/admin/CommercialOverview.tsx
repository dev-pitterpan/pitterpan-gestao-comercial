import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  BellRing,
  Package,
  ShoppingCart,
  Store,
  Wallet,
} from "lucide-react";
import { database } from "../../server/database/client";
import { salesConfig, salesReady } from "../../server/sales/config";
import { readCommercialOverview } from "../../server/sales/repository";
import { fulfillmentLabels } from "../../lib/admin/fulfillment";
import { salesPageLink } from "../../lib/admin/sales-links";
import { number, dateTime } from "./Primitives";
import CommercialTrend from "./CommercialTrend";
import {
  shiftDate,
  todayDate,
  type DateRange,
} from "../../lib/admin/date-range";
import OrderFulfillmentDetails from "./OrderFulfillmentDetails";

export async function loadOverview(range: DateRange) {
  if (!salesReady()) return null;
  const db = await database().connect();
  try {
    await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const data = await readCommercialOverview(
      db,
      salesConfig().SHOPIFY_SALES_STORE_DOMAIN,
      7,
      range,
    );
    await db.query("COMMIT");
    return data;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}

export default function CommercialOverview({
  range,
  data,
  admin,
}: {
  range: DateRange;
  admin: boolean;
  data: Awaited<ReturnType<typeof loadOverview>>;
}) {
  const syncedAt = data?.sales.state?.completed_at;
  const stale = syncedAt && Date.now() - Date.parse(syncedAt) > 86_400_000;
  const filters = new URLSearchParams(range);
  const salesHref = salesPageLink("/gestor/vendas/resumo/", filters);
  const operationsHref = salesPageLink("/gestor/vendas/atendimento/", filters);
  const cards = data
    ? [
        {
          label: "Pedidos pagos",
          icon: ShoppingCart,
          tone: "blue",
          value: data.sales.totals.length
            ? number(
                data.sales.totals.reduce(
                  (total, row) => total + Number(row.paid),
                  0,
                ),
              )
            : "—",
          href: salesPageLink("/gestor/vendas/", filters, {
            status: "PAID_ACTIVE",
          }),
          hint: "No período selecionado",
        },
        {
          label: "Recebido após reembolsos",
          icon: Wallet,
          tone: "green",
          value:
            data.sales.totals
              .map((row) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: row.currency,
                }).format(Number(row.net)),
              )
              .join(" · ") || "—",
          href: salesPageLink("/gestor/vendas/recebimentos/", filters, {
            metric: "net",
          }),
          hint: "Recebimentos menos reembolsos",
        },
        {
          label: "Pedidos a preparar",
          icon: Package,
          tone: "amber",
          value: number(Number(data.queue.preparing)),
          href: operationsHref,
          hint: "Atendimentos em aberto, exceto retiradas prontas",
        },
        {
          label: "Retiradas prontas",
          icon: Store,
          tone: "teal",
          value: number(Number(data.queue.ready)),
          href: operationsHref,
          hint: "Aguardando retirada do cliente",
        },
      ]
    : [];
  const orderedCards = admin
    ? [cards[1], cards[0], ...cards.slice(2)].filter(Boolean)
    : [...cards.slice(2), ...cards.slice(0, 2)];
  const preparing = Number(data?.queue.preparing || 0);
  const ready = Number(data?.queue.ready || 0);
  const awaiting = preparing + ready;
  return (
    <section
      aria-label="Resumo comercial Shopify"
      className="commercial-overview workspace-commercial"
    >
      <header className="workspace-commercial-heading">
        <span className="workspace-source-label">
          <ShoppingCart size={14} /> OPERAÇÃO SHOPIFY
        </span>
        <span className="workspace-sync-label">
          {syncedAt
            ? `Conferido até ${dateTime(syncedAt)}`
            : "Sincronização ainda sem confirmação"}
        </span>
      </header>
      {!data ? (
        <p className="admin-data-notice" role="status">
          Os dados de vendas estão indisponíveis. Confira a sincronização em
          Vendas e pedidos.
        </p>
      ) : (
        <>
          {(!data.sales.state?.completed_at || data.sales.state.until_at) && (
            <p className="admin-inline-note">
              Os dados importados podem estar incompletos.{" "}
              {data.sales.state?.until_at && "Sincronização em andamento."}
            </p>
          )}
          {range.start < shiftDate(todayDate(), -59) && (
            <p className="admin-inline-note">
              O início do período está fora da janela automática de 60 dias. Os
              indicadores usam o histórico disponível.
            </p>
          )}
          {stale && (
            <p className="admin-data-notice">
              A última sincronização de vendas foi há mais de 24 horas.
            </p>
          )}
        </>
      )}
      <div className="workspace-metrics">
        {(data
          ? orderedCards
          : [
              {
                label: "Recebido após reembolsos",
                icon: Wallet,
                tone: "green",
                value: "—",
                href: salesHref,
                hint: "Aguardando sincronização",
              },
              {
                label: "Pedidos pagos",
                icon: ShoppingCart,
                tone: "blue",
                value: "—",
                href: salesHref,
                hint: "Aguardando sincronização",
              },
              {
                label: "Pedidos a preparar",
                icon: Package,
                tone: "amber",
                value: "—",
                href: operationsHref,
                hint: "Aguardando sincronização",
              },
              {
                label: "Retiradas prontas",
                icon: Store,
                tone: "teal",
                value: "—",
                href: operationsHref,
                hint: "Aguardando sincronização",
              },
            ]
        ).map(({ label, icon: Icon, tone, value, href, hint }) => (
          <Link
            key={label}
            href={href}
            className={`workspace-metric workspace-metric--${tone}`}
          >
            <div className="workspace-metric-top">
              <span>
                <Icon size={17} />
              </span>
              <ArrowRight size={15} />
            </div>
            <span className="workspace-metric-label">{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
          </Link>
        ))}
      </div>
      <div className="workspace-performance-grid" id="workspace-performance">
        <section className="workspace-trend-card">
          <div className="workspace-chart-eyebrow">
            <span>
              <i /> PERFORMANCE
            </span>
            <Link href={salesHref}>
              Explorar vendas <ArrowRight size={14} />
            </Link>
          </div>
          {data ? (
            <CommercialTrend
              key={`${range.start}-${range.end}`}
              sales={data.sales}
              previousDaily={data.previousDaily}
            />
          ) : (
            <div className="workspace-chart-empty">
              <ChartNoAxesCombined size={38} />
              <h2>Seu desempenho começa aqui</h2>
              <p>
                Sincronize os pedidos para acompanhar a evolução das vendas com
                dados reais.
              </p>
              <Link href="/gestor/sincronizacoes/">
                Conferir sincronização <ArrowRight size={15} />
              </Link>
            </div>
          )}
          <p className="workspace-chart-footnote">
            Recebimentos e reembolsos pela data de processamento do pedido ·
            Horário de Brasília
          </p>
        </section>
        <div className="workspace-operations">
          <section
            className="workspace-queue-card"
            aria-labelledby="workspace-queue-heading"
          >
            <header>
              <h2 id="workspace-queue-heading">Fila de atendimento</h2>
              <Package size={17} />
            </header>
            <div className="workspace-queue-numbers">
              <div>
                <strong>{data ? number(preparing) : "—"}</strong>
                <span>
                  <i /> A preparar
                </span>
              </div>
              <div>
                <strong>{data ? number(ready) : "—"}</strong>
                <span>
                  <i /> Retiradas prontas
                </span>
              </div>
            </div>
            <div className="workspace-queue-track" aria-hidden="true">
              <span
                style={{
                  width: `${awaiting ? (preparing / awaiting) * 100 : 0}%`,
                }}
              />
              <span
                style={{ width: `${awaiting ? (ready / awaiting) * 100 : 0}%` }}
              />
            </div>
            <Link href={operationsHref}>
              Abrir atendimento <ArrowRight size={13} />
            </Link>
          </section>
          <section className="workspace-priorities" id="overview-pending">
            <header>
              <h2>
                <BellRing size={17} /> Atenção agora
              </h2>
              <span>
                {data ? `${number(awaiting)} em aberto` : "Sem confirmação"}
              </span>
            </header>
            <p>
              Até cinco pendências mais antigas do histórico importado,
              independentemente do período.
            </p>
            {data?.pending.length ? (
              <ul
                className="sales-operations-orders"
                tabIndex={0}
                aria-label="Lista de pendências de atendimento"
              >
                {data.pending.map((order) => (
                  <li key={order.id}>
                    <div>
                      <a
                        href={`https://${data.store}/admin/orders/${order.id.split("/").at(-1)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {order.name}
                      </a>
                      <span className="sales-operations-customer">
                        {order.customer_name || "Nome do cliente indisponível"}
                      </span>
                      <small>
                        {dateTime(order.processed_at)} ·{" "}
                        {fulfillmentLabels[order.fulfillment_status] ??
                          order.fulfillment_status}
                      </small>
                    </div>
                    <OrderFulfillmentDetails
                      id={order.id}
                      name={order.name}
                      storedStatus={order.fulfillment_status}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="workspace-no-pending">
                {data
                  ? "Nenhuma pendência encontrada no histórico importado."
                  : "Sincronize os pedidos para conferir as pendências."}
              </p>
            )}
            <Link href={salesPageLink("/gestor/vendas/", filters)}>
              Ver todos os pedidos <ArrowRight size={13} />
            </Link>
          </section>
        </div>
      </div>
    </section>
  );
}
