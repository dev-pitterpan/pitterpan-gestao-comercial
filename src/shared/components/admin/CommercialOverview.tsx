import Link from "next/link";
import {
  ArrowRight,
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
          tone: "violet",
          value: number(Number(data.queue.ready)),
          href: operationsHref,
          hint: "Aguardando retirada do cliente",
        },
      ]
    : [];
  const orderedCards = admin
    ? [cards[1], cards[0], ...cards.slice(2)].filter(Boolean)
    : [...cards.slice(2), ...cards.slice(0, 2)];
  return (
    <section
      aria-label="Resumo comercial Shopify"
      className="commercial-overview"
    >
      <header className="sales-operations-heading">
        <div>
          <span className="admin-eyebrow">OPERAÇÃO SHOPIFY</span>
          <h2>Vendas e prioridades</h2>
          <p>
            Última sincronização de vendas{" "}
            {data?.sales.state?.completed_at
              ? dateTime(data.sales.state.completed_at)
              : "ainda sem confirmação"}
            {data?.sales.state?.until_at && " · Sincronização em andamento"}
          </p>
        </div>
        <div className="sales-workspace-links">
          <Link className="admin-button" href={salesHref}>
            Resumo Shopify <ArrowRight size={15} />
          </Link>
        </div>
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
              Os dados importados podem estar incompletos.
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
          <div className="admin-stats">
            {orderedCards.map(
              ({ label, icon: Icon, tone, value, href, hint }) => (
                <Link
                  key={label}
                  className={`admin-stat admin-stat--${tone}`}
                  href={href}
                >
                  <div>
                    <span className={`admin-stat-icon ${tone}`}>
                      <Icon size={20} aria-hidden="true" />
                    </span>
                  </div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{hint}</small>
                </Link>
              ),
            )}
          </div>
          <div className="commercial-overview-grid">
            <section
              className="admin-panel commercial-overview-alert"
              id="overview-pending"
            >
              <header>
                <h2>
                  <BellRing size={19} aria-hidden="true" /> Atenção agora
                </h2>
                <span className="commercial-overview-alert-count">
                  {number(
                    Number(data.queue.preparing) + Number(data.queue.ready),
                  )}{" "}
                  em aberto
                </span>
              </header>
              <p className="admin-inline-note">
                Até cinco pendências mais antigas do histórico importado,
                independentemente do período de vendas.
              </p>
              {data.pending.length ? (
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
                          {order.customer_name ||
                            "Nome do cliente indisponível"}
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
                <p className="admin-inline-note">
                  Nenhuma pendência encontrada no histórico importado.
                </p>
              )}
              <Link
                href={salesPageLink("/gestor/vendas/", filters)}
                className="admin-text-link"
              >
                Abrir Vendas e pedidos <ArrowRight size={15} />
              </Link>
            </section>
            <section className="admin-panel commercial-overview-trend">
              <CommercialTrend
                key={`${range.start}-${range.end}`}
                sales={data.sales}
                previousDaily={data.previousDaily}
              />
            </section>
          </div>
        </>
      )}
    </section>
  );
}
