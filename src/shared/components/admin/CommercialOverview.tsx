import Link from "next/link";
import { ArrowRight, Package, ShoppingCart, Store, Wallet } from "lucide-react";
import { database } from "../../server/database/client";
import { salesConfig, salesReady } from "../../server/sales/config";
import { readCommercialOverview } from "../../server/sales/repository";
import { fulfillmentLabels } from "../../lib/admin/fulfillment";
import { salesLink } from "../../lib/admin/sales-links";
import { number, dateTime } from "./Primitives";
import CommercialTrend from "./CommercialTrend";
import OrderFulfillmentDetails from "./OrderFulfillmentDetails";

async function loadOverview(days: number) {
  if (!salesReady()) return null;
  const db = await database().connect();
  try {
    await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const data = await readCommercialOverview(
      db,
      salesConfig().SHOPIFY_SALES_STORE_DOMAIN,
      days,
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

export default async function CommercialOverview({
  days,
  lowStock,
}: {
  days: number;
  lowStock: number;
}) {
  const data = await loadOverview(days).catch(() => null);
  const syncedAt = data?.sales.state?.completed_at;
  const stale = syncedAt && Date.now() - Date.parse(syncedAt) > 86_400_000;
  const filters = new URLSearchParams({ days: String(days) });
  const salesHref = salesLink(filters);
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
          href: salesLink(filters, { status: "PAID" }, "recent-orders"),
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
          href: salesHref,
          hint: "Recebimentos menos reembolsos",
        },
        {
          label: "Pedidos a preparar",
          icon: Package,
          tone: "amber",
          value: number(Number(data.queue.preparing)),
          href: "#overview-pending",
          hint: "Atendimentos em aberto, exceto retiradas prontas",
        },
        {
          label: "Retiradas prontas",
          icon: Store,
          tone: "violet",
          value: number(Number(data.queue.ready)),
          href: "#overview-pending",
          hint: "Aguardando retirada do cliente",
        },
      ]
    : [];
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
        <nav
          className="commercial-overview-controls"
          aria-label="Período de vendas"
        >
          {[
            [1, "Hoje"],
            [7, "7 dias"],
            [30, "30 dias"],
          ].map(([period, label]) => (
            <Link
              key={period}
              href={`/gestor/?periodo=${period}`}
              scroll={false}
              className="admin-button"
              aria-current={period === days ? "true" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
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
          {stale && (
            <p className="admin-data-notice">
              A última sincronização de vendas foi há mais de 24 horas.
            </p>
          )}
          <div className="admin-stats">
            {cards.map(({ label, icon: Icon, tone, value, href, hint }) => (
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
            ))}
          </div>
          <div className="commercial-overview-grid">
            <section className="admin-panel" id="overview-pending">
              <header>
                <h2>Atenção agora</h2>
              </header>
              <p className="admin-inline-note">
                Até cinco pendências mais antigas do histórico importado,
                independentemente do período de vendas.
              </p>
              {data.pending.length ? (
                <ul className="sales-operations-orders">
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
                        <small>
                          {dateTime(order.processed_at)} ·{" "}
                          {fulfillmentLabels[order.fulfillment_status] ??
                            order.fulfillment_status}
                        </small>
                        <OrderFulfillmentDetails
                          id={order.id}
                          name={order.name}
                          storedStatus={order.fulfillment_status}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-inline-note">
                  Nenhuma pendência encontrada no histórico importado.
                </p>
              )}
              <Link href="/gestor/vendas/" className="admin-text-link">
                Abrir Vendas e pedidos <ArrowRight size={15} />
              </Link>
            </section>
            <section className="admin-panel commercial-overview-trend">
              <header>
                <h2>Evolução das vendas</h2>
              </header>
              <CommercialTrend
                key={days}
                sales={data.sales}
                previousDaily={data.previousDaily}
              />
            </section>
          </div>
          <section className="admin-panel">
            <header>
              <h2>Produtos mais vendidos</h2>
              <span className="admin-subtle">Unidades no período</span>
            </header>
            {data.ranking.length ? (
              <ol className="analytics-ranking">
                {data.ranking.map((item, index) => (
                  <li key={item.id}>
                    <span className="analytics-rank-number">{index + 1}</span>
                    <div>
                      <div className="analytics-rank-caption">
                        <span title={item.title}>{item.title}</span>
                        <strong>{number(Number(item.units))}</strong>
                      </div>
                      {item.stock !== null && (
                        <small>
                          {item.stock <= 0
                            ? "Sem estoque"
                            : item.stock <= lowStock
                              ? "Estoque baixo"
                              : "Estoque agregado"}
                          {" · "}
                          {number(item.stock)} un.
                        </small>
                      )}
                      <div className="analytics-bar-track" aria-hidden="true">
                        <span
                          style={{
                            width: `${(Number(item.units) * 100) / Number(data.ranking[0].units)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="admin-inline-note">
                Nenhum produto vendido nos pedidos importados deste período.
              </p>
            )}
            <Link
              href={salesLink(filters, {}, "sold-products")}
              className="admin-text-link"
            >
              Ver produtos vendidos <ArrowRight size={15} />
            </Link>
          </section>
        </>
      )}
    </section>
  );
}
