"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Wallet,
  CircleDollarSign,
  ShoppingBag,
  TrendingUp,
  Undo2,
  PackageCheck,
  Clock3,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import SalesTrendChart, { salesTrendPoints } from "./SalesTrendChart";
import AdminSelect from "./AdminSelect";
import { summaryDailyRows } from "../../lib/admin/sales-summary";
import { salesPageLink } from "../../lib/admin/sales-links";
import type { readSales } from "../../server/sales/repository";
import "../../styles/admin/shopify-summary.css";

type Data = Awaited<ReturnType<typeof readSales>>;
const number = (value: string | number) =>
  Number(value).toLocaleString("pt-BR");
export default function ShopifySummary({
  data,
  params,
  start,
  end,
  loading,
}: {
  data: Data;
  params: URLSearchParams;
  start: string;
  end: string;
  loading: boolean;
}) {
  const [selectedCurrency, setCurrency] = useState("BRL");
  const [metric, setMetric] = useState<"received" | "net">("received");
  const total =
    data.totals.find((row) => row.currency === selectedCurrency) ??
    data.totals[0];
  if (!total) return null;
  const currency = total.currency;
  const money = (value: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
      Number(value),
    );
  const rows = summaryDailyRows({
    daily: data.daily,
    currency,
    start,
    end,
    completedAt: data.state?.completed_at,
    importing: !!data.state?.until_at,
  });
  const receipts = (metric?: string) =>
    salesPageLink("/gestor/vendas/recebimentos/", params, {
      status: "",
      fulfillment: "",
      ...(metric ? { metric } : {}),
    });
  const orders = (overrides: Record<string, string>) =>
    salesPageLink("/gestor/vendas/", params, {
      status: "",
      fulfillment: "",
      ...overrides,
    });
  const refunds = salesPageLink("/gestor/vendas/reembolsos/", params, {
    status: "",
    fulfillment: "",
  });
  const kpis = [
    {
      label: "Líquido após reembolsos",
      value: money(total.net),
      detail: "Recebido menos reembolsado",
      href: receipts("net"),
      icon: Wallet,
      tone: "net",
    },
    {
      label: "Recebido confirmado",
      value: money(total.received),
      detail: "Inclui frete e impostos",
      href: receipts(),
      icon: CircleDollarSign,
      tone: "received",
    },
    {
      label: "Pedidos pagos",
      value: number(total.paid),
      detail: `${money(total.paid_value)} · não cancelados`,
      href: orders({ status: "PAID_ACTIVE" }),
      icon: ShoppingBag,
      tone: "paid",
    },
    {
      label: "Ticket médio",
      value: money(total.ticket),
      detail: "Média dos pedidos pagos não cancelados",
      href: orders({ status: "PAID_ACTIVE" }),
      icon: TrendingUp,
      tone: "ticket",
    },
  ];
  return (
    <section
      className="shopify-summary"
      aria-label="Resumo comercial da Shopify"
      aria-busy={loading}
    >
      <div className="shopify-summary-context">
        <div>
          <span className="summary-source-dot" />
          Shopify <span>·</span> {number(total.orders)} pedidos na seleção{" "}
          <span>·</span> {currency}
        </div>
        {data.totals.length > 1 && (
          <AdminSelect
            label="Moeda dos indicadores"
            value={currency}
            onValueChange={setCurrency}
            options={data.totals.map((row) => ({
              value: row.currency,
              label: row.currency,
            }))}
          />
        )}
      </div>
      <div className="summary-kpis">
        {kpis.map(({ label, value, detail, href, icon: Icon, tone }) => (
          <Link
            className={`summary-kpi summary-kpi--${tone}`}
            href={href}
            key={tone}
          >
            <div>
              <span className="summary-kpi-icon">
                <Icon size={18} />
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </Link>
        ))}
      </div>
      <div className="summary-analysis-grid">
        <section
          className="summary-chart-card"
          aria-label="Evolução financeira dos pedidos"
        >
          <SalesTrendChart
            key={currency}
            title="Evolução financeira"
            label={
              metric === "received"
                ? "Recebido por data do pedido"
                : "Líquido por data do pedido"
            }
            total={money(total[metric])}
            rows={salesTrendPoints(rows, metric)}
            format={money}
            height={248}
            controls={
              <div
                className="summary-metric-toggle"
                role="group"
                aria-label="Indicador da evolução"
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
            }
          />
        </section>
        <section className="summary-reconciliation">
          <header>
            <span className="summary-section-icon">
              <Wallet size={18} />
            </span>
            <div>
              <h2>Conferência financeira</h2>
              <p>Valores dos pedidos selecionados</p>
            </div>
          </header>
          <dl>
            <div>
              <dt>Recebido</dt>
              <dd>{money(total.received)}</dd>
            </div>
            <div>
              <dt>Reembolsado</dt>
              <dd>{money(total.refunded)}</dd>
            </div>
            <div className="summary-net-line">
              <dt>Líquido</dt>
              <dd>{money(total.net)}</dd>
            </div>
          </dl>
          <Link href={refunds} className="summary-refund-link">
            <span>
              <Undo2 size={16} />
              {number(total.refunded_orders)} pedidos com reembolso
            </span>
            <ChevronRight size={15} />
          </Link>
          <Link className="summary-primary-link" href={receipts()}>
            Abrir financeiro <ArrowUpRight size={15} />
          </Link>
          <p>
            Valores agrupados pela data do pedido; não representam o fechamento
            do caixa por data de pagamento.
          </p>
        </section>
      </div>
      <section className="summary-operations">
        <header>
          <div>
            <span>ACOMPANHAR A OPERAÇÃO</span>
            <h2>O que precisa de atenção</h2>
          </div>
          <Link href={salesPageLink("/gestor/vendas/", params)}>
            Ver pedidos <ArrowUpRight size={15} />
          </Link>
        </header>
        <div className="summary-operation-grid">
          {[
            {
              label: "Aguardando pagamento",
              value: total.pending,
              detail: `${money(total.outstanding)} de saldo não pago${Number(total.outstanding_estimated) ? " · parte calculada" : ""}`,
              href: orders({ status: "OPEN_BALANCE" }),
              icon: Clock3,
              tone: "amber",
            },
            {
              label: "Atendimento em aberto",
              value: total.awaiting,
              detail: "Pedidos pagos com atendimento pendente",
              href: salesPageLink("/gestor/vendas/atendimento/", params, {
                status: "",
                fulfillment: "AWAITING",
              }),
              icon: PackageCheck,
              tone: "teal",
            },
            {
              label: "Expirados",
              value: total.expired,
              detail: `${money(total.expired_value)} em valor dos pedidos`,
              href: orders({ status: "EXPIRED" }),
              icon: Clock3,
              tone: "neutral",
            },
            {
              label: "Cancelados",
              value: total.cancelled,
              detail: `${money(total.cancelled_value)} em valor dos pedidos`,
              href: orders({ status: "CANCELLED" }),
              icon: Undo2,
              tone: "rose",
            },
          ].map(({ label, value, detail, href, icon: Icon, tone }) => (
            <Link
              key={label}
              href={href}
              className={`summary-operation summary-operation--${tone}`}
            >
              <div>
                <Icon size={17} />
                <ArrowUpRight size={14} />
              </div>
              <strong>{number(value)}</strong>
              <span>{label}</span>
              <small>{detail}</small>
            </Link>
          ))}
        </div>
        <details className="summary-accounting-note">
          <summary>Entenda as situações e os valores</summary>
          <p>
            As situações podem se sobrepor: cancelamento é independente do
            pagamento. Não some esses quadros. Expirados, cancelados e anulados
            mostram valores dos pedidos, não dinheiro recebido. Há{" "}
            {number(total.voided)} pedidos anulados ({money(total.voided_value)}
            );{" "}
            <Link href={orders({ status: "VOIDED" })}>consultar anulados</Link>.
            Os reembolsos são acumulados dos pedidos selecionados e podem ter
            ocorrido depois do período. Pedidos de teste são excluídos.
          </p>
        </details>
      </section>
      {Number(total.inconsistent) > 0 && (
        <p className="admin-data-notice" role="status">
          Há {number(total.inconsistent)} pedidos com divergência nos campos
          financeiros da Shopify. O líquido usa recebido menos reembolsado;
          sincronize para conferir.
        </p>
      )}
      <footer className="summary-sync-state">
        <span>
          <ShieldCheck size={15} />
          {data.state?.completed_at
            ? `Conferência da importação: ${new Date(data.state.completed_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
            : "Importação inicial ainda não concluída"}
        </span>
        <span>{number(data.pending)} eventos na fila de sincronização</span>
        {data.oldestPendingAt && (
          <span>
            Mais antigo:{" "}
            {new Date(data.oldestPendingAt).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}
          </span>
        )}
      </footer>
    </section>
  );
}
