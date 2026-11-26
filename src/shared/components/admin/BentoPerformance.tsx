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
import type { readCommercialOverview } from "../../server/sales/repository";
import "../../styles/admin/bento-summary.css";
export default function BentoPerformance({
  data,
}: {
  data: Awaited<ReturnType<typeof readCommercialOverview>>;
}) {
  const { sales, previousDaily, previousWindow, ranking } = data;
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
  const normalized = {
    currency,
    completedAt: sales.state?.completed_at,
    importing: !!sales.state?.until_at,
  };
  const rows = summaryDailyRows({
    ...normalized,
    ...sales.window,
    daily: sales.daily,
  });
  const previous = previousDaily
    ? summaryDailyRows({
        ...normalized,
        ...previousWindow,
        daily: previousDaily,
      })
    : undefined;
  const largest = Math.max(
    1,
    ...ranking.map((product) => Number(product.units)),
  );
  const count = new Intl.NumberFormat("pt-BR");
  const params = new URLSearchParams(sales.window);
  const receipts = salesPageLink("/gestor/vendas/recebimentos/", params);
  return (
    <section
      className="bento-summary overview-performance"
      aria-label="Desempenho comercial em bento"
      id="workspace-performance"
    >
      <div className="bento-context">
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
          previous={previous}
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
        <section className="bento-tile overview-product-ranking">
          <header>
            <h2>Produtos mais vendidos</h2>
            <Link href={salesPageLink("/gestor/produtos-vendidos/", params)}>
              Ver ranking <ArrowUpRight size={15} />
            </Link>
          </header>
          {ranking.length ? (
            <ol>
              {ranking.map((product) => (
                <li key={product.id}>
                  <div>
                    <span>{product.title}</span>
                    <strong>{count.format(Number(product.units))} un.</strong>
                  </div>
                  <span className="overview-ranking-track" aria-hidden="true">
                    <i
                      style={{
                        width: `${(100 * Number(product.units)) / largest}%`,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p>Sem produtos vendidos no período.</p>
          )}
        </section>
        <BentoActivity
          key={`calendar-${currency}`}
          rows={rows}
          currency={currency}
        />
      </div>
    </section>
  );
}
