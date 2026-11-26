import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  ShoppingCart,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { database } from "../../server/database/client";
import { salesConfig, salesReady } from "../../server/sales/config";
import { readCommercialOverview } from "../../server/sales/repository";
import { salesPageLink } from "../../lib/admin/sales-links";
import { number, dateTime } from "./Primitives";
import BentoPerformance from "./BentoPerformance";
import {
  shiftDate,
  todayDate,
  type DateRange,
} from "../../lib/admin/date-range";

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
      ]
    : [];
  const moneyMetric = (key: string) =>
    data?.sales.totals
      .map((row) =>
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: row.currency,
        }).format(Number(row[key])),
      )
      .join(" · ") || "—";
  const performanceCards = [
    cards[1],
    cards[0],
    {
      label: "Ticket dos pedidos pagos",
      icon: ArrowUpRight,
      tone: "teal",
      value: moneyMetric("ticket"),
      href: salesPageLink("/gestor/vendas/", filters, {
        status: "PAID_ACTIVE",
      }),
      hint: "Média dos pedidos pagos e não cancelados",
    },
    {
      label: "Estornos e reembolsos",
      icon: ArrowDownLeft,
      tone: "rose",
      value: moneyMetric("refunded"),
      href: salesPageLink("/gestor/vendas/reembolsos/", filters),
      hint: "Reembolsos dos pedidos do período",
    },
  ].filter(Boolean);
  const orderedCards = admin
    ? performanceCards
    : [performanceCards[1], performanceCards[0], ...performanceCards.slice(2)];
  return (
    <section
      aria-label="Resumo comercial Shopify"
      className="commercial-overview workspace-commercial content-commercial--performance"
    >
      <header className="workspace-commercial-heading">
        <span className="workspace-source-label">
          <ShoppingCart size={14} /> Vendas Shopify
        </span>
        <span className="workspace-sync-label">
          {syncedAt
            ? `Última sincronização ${dateTime(syncedAt)}`
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
                label: "Ticket dos pedidos pagos",
                icon: ArrowUpRight,
                tone: "teal",
                value: "—",
                href: salesHref,
                hint: "Aguardando sincronização",
              },
              {
                label: "Estornos e reembolsos",
                icon: ArrowDownLeft,
                tone: "rose",
                value: "—",
                href: salesHref,
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

      {data ? (
        <BentoPerformance key={`${range.start}-${range.end}`} data={data} />
      ) : (
        <section
          className="admin-panel"
          aria-label="Desempenho comercial em bento"
        >
          <div className="workspace-chart-empty">
            <ChartNoAxesCombined size={38} />
            <h2>Evolução das vendas indisponível</h2>
            <p>
              Sincronize os pedidos para acompanhar a evolução das vendas com
              dados reais.
            </p>
            <Link href="/gestor/sincronizacoes/">
              Conferir sincronização <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}
    </section>
  );
}
