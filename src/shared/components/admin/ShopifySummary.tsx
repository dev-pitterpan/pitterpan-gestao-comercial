"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ShoppingBag,
  ReceiptText,
  PackageCheck,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import AdminSelect from "./AdminSelect";
import BentoRevenueChart from "./BentoRevenueChart";
import BentoComposition from "./BentoComposition";
import BentoActivity from "./BentoActivity";
import { summaryDailyRows } from "../../lib/admin/sales-summary";
import { salesPageLink } from "../../lib/admin/sales-links";
import type { readSales } from "../../server/sales/repository";
import "../../styles/admin/bento-summary.css";
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
  const receipts = salesPageLink("/gestor/vendas/recebimentos/", params, {
    status: "",
    fulfillment: "",
  });
  const refunds = salesPageLink("/gestor/vendas/reembolsos/", params, {
    status: "",
    fulfillment: "",
  });
  const orders = (status: string) =>
    salesPageLink("/gestor/vendas/", params, { status, fulfillment: "" });
  const paidRate =
    Number(total.orders) > 0 ? Number(total.paid) / Number(total.orders) : null;
  return (
    <section
      className="bento-summary shopify-performance"
      aria-label="Resumo comercial da Shopify"
      aria-busy={loading}
    >
      <div className="bento-context">
        <span>
          <i />
          Shopify · {number(total.orders)} pedidos na seleção · {currency}
        </span>
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
      <div className="bento-board">
        <BentoRevenueChart
          key={currency}
          rows={rows}
          received={total.received}
          net={total.net}
          currency={currency}
        />
        <BentoComposition
          received={total.received}
          refunded={total.refunded}
          net={total.net}
          currency={currency}
          href={receipts}
        >
          <Link href={refunds} className="bento-refunds-link">
            {number(total.refunded_orders)} pedidos com reembolso{" "}
            <ArrowUpRight size={13} />
          </Link>
        </BentoComposition>
        <Link
          className="bento-tile bento-kpi bento-paid"
          href={orders("PAID_ACTIVE")}
        >
          <header>
            <ShoppingBag size={17} />
            <ArrowUpRight size={16} />
          </header>
          <span>Pedidos pagos</span>
          <strong>{number(total.paid)}</strong>
          <div className="bento-paid-track" aria-hidden="true">
            <i style={{ width: `${(paidRate ?? 0) * 100}%` }} />
          </div>
          <small>
            {paidRate === null
              ? "Sem pedidos na seleção"
              : `${new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(paidRate)} dos pedidos · não cancelados`}
          </small>
        </Link>
        <Link
          className="bento-tile bento-kpi bento-ticket"
          href={orders("PAID_ACTIVE")}
        >
          <header>
            <ReceiptText size={17} />
            <ArrowUpRight size={16} />
          </header>
          <span>Ticket médio</span>
          <strong>{money(total.ticket)}</strong>
          <small>Média dos pedidos pagos não cancelados</small>
        </Link>
        <section
          className="bento-tile bento-queue"
          aria-label="Pendências dos pedidos"
        >
          <header>
            <div>
              <span className="bento-eyebrow">OPERAÇÃO</span>
              <h2>Próximas ações</h2>
            </div>
            <PackageCheck size={18} />
          </header>
          <div>
            <Link
              href={salesPageLink("/gestor/vendas/atendimento/", params, {
                status: "",
                fulfillment: "AWAITING",
              })}
            >
              <span>
                <PackageCheck size={14} />
                Atendimento em aberto
              </span>
              <strong>{number(total.awaiting)}</strong>
              <ArrowUpRight size={14} />
            </Link>
            <Link href={orders("OPEN_BALANCE")}>
              <span>
                <Clock3 size={14} />
                Aguardando pagamento
              </span>
              <strong>{number(total.pending)}</strong>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
        <BentoActivity
          key={`activity-${currency}`}
          rows={rows}
          currency={currency}
        />
        <section className="bento-tile bento-statuses">
          <header>
            <div>
              <span className="bento-eyebrow">SITUAÇÕES DOS PEDIDOS</span>
              <h2>Conferir exceções</h2>
            </div>
            <span>Valores dos pedidos, sem somar situações</span>
          </header>
          <div>
            {[
              {
                label: "Saldo não pago",
                count: total.pending,
                value: total.outstanding,
                status: "OPEN_BALANCE",
              },
              {
                label: "Expirados",
                count: total.expired,
                value: total.expired_value,
                status: "EXPIRED",
              },
              {
                label: "Anulados",
                count: total.voided,
                value: total.voided_value,
                status: "VOIDED",
              },
              {
                label: "Cancelados",
                count: total.cancelled,
                value: total.cancelled_value,
                status: "CANCELLED",
              },
            ].map((item) => (
              <Link href={orders(item.status)} key={item.status}>
                <span>
                  {item.label}
                  <ArrowUpRight size={13} />
                </span>
                <strong>{money(item.value)}</strong>
                <small>
                  {number(item.count)} pedidos
                  {item.status === "OPEN_BALANCE" &&
                  Number(total.outstanding_estimated)
                    ? " · parte calculada"
                    : ""}
                </small>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <details className="bento-definitions">
        <summary>Como interpretar os indicadores</summary>
        <p>
          Os valores são agrupados pela data do pedido e incluem frete e
          impostos. O líquido é recebido menos reembolsado, sem deduzir custos:
          não é lucro nem fechamento do caixa por data de pagamento. Reembolsos
          podem ter ocorrido após o período. Cancelamento é independente do
          pagamento; as situações podem se sobrepor. Dias sem cobertura não são
          tratados como zero. Pedidos de teste são excluídos.
          {total.outstanding_estimated !== "0"
            ? " Parte do saldo não pago foi calculada por ausência do valor oficial da Shopify."
            : ""}
        </p>
      </details>
      {Number(total.inconsistent) > 0 && (
        <p className="admin-data-notice" role="status">
          Há {number(total.inconsistent)} pedidos com divergência nos campos
          financeiros da Shopify. Sincronize para conferir.
        </p>
      )}
      <footer className="bento-sync">
        <span>
          <ShieldCheck size={14} />
          {data.state?.completed_at
            ? `Conferência: ${new Date(data.state.completed_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
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
