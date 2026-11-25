"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AdminSelect from "./AdminSelect";
import BentoRevenueChart from "./BentoRevenueChart";
import BentoComposition from "./BentoComposition";
import BentoActivity from "./BentoActivity";
import { summaryDailyRows } from "../../lib/admin/sales-summary";
import { salesPageLink } from "../../lib/admin/sales-links";
import type { readSalesFinance } from "../../server/sales/repository";
import "../../styles/admin/bento-summary.css";
export default function BentoPerformance({
  sales,
}: {
  sales: Awaited<ReturnType<typeof readSalesFinance>>;
}) {
  const [selected, setCurrency] = useState("BRL");
  const total =
    sales.totals.find((row) => row.currency === selected) ?? sales.totals[0];
  if (!total)
    return (
      <section
        className="admin-panel"
        aria-label="Desempenho comercial em bento"
      >
        <h2>Nenhum pedido importado neste período</h2>
        <p>Confira os filtros e a última sincronização.</p>
      </section>
    );
  const currency = total.currency;
  const money = (value: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
      Number(value),
    );
  const rows = summaryDailyRows({
    daily: sales.daily,
    currency,
    ...sales.window,
    completedAt: sales.state?.completed_at,
    importing: !!sales.state?.until_at,
  });
  const params = new URLSearchParams(sales.window);
  const receipts = salesPageLink("/gestor/vendas/recebimentos/", params);
  return (
    <section
      className="bento-summary reference-sheet"
      aria-label="Desempenho comercial em bento"
      id="workspace-performance"
    >
      <div className="bento-context">
        <span>Desempenho da Shopify · {currency}</span>
        {sales.totals.length > 1 && (
          <AdminSelect
            label="Moeda do desempenho"
            value={currency}
            onValueChange={setCurrency}
            options={sales.totals.map((row) => ({
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
          currency={currency}
          received={total.received}
          net={total.net}
        />
        <BentoComposition
          currency={currency}
          received={total.received}
          refunded={total.refunded}
          net={total.net}
          href={receipts}
        />
        <BentoActivity
          key={`calendar-${currency}`}
          rows={rows}
          currency={currency}
        />
        <section className="bento-tile bento-balance">
          <header>
            <div>
              <span className="bento-eyebrow">CONFERÊNCIA</span>
              <h2>Resultado dos pedidos</h2>
            </div>
            <ArrowUpRight size={17} />
          </header>
          <dl>
            <div>
              <dt>Recebido</dt>
              <dd>{money(total.received)}</dd>
            </div>
            <div>
              <dt>− Reembolsado</dt>
              <dd>{money(total.refunded)}</dd>
            </div>
            <div>
              <dt>= Líquido</dt>
              <dd>{money(total.net)}</dd>
            </div>
          </dl>
          <Link href={salesPageLink("/gestor/vendas/resumo/", params)}>
            Explorar resumo comercial <ArrowUpRight size={15} />
          </Link>
          <p className="bento-balance-note">
            Data dos pedidos · Brasília. O líquido não deduz custos e não
            representa lucro.
          </p>
        </section>
      </div>
    </section>
  );
}
