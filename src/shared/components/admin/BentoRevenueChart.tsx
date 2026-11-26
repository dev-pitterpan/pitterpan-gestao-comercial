"use client";
import { useState } from "react";
import { bentoSeries, type BentoDay } from "../../lib/admin/bento-series";
import { chartDate } from "../../lib/admin/infographic";
import FinancialTrend from "./FinancialTrend";
export default function BentoRevenueChart({
  rows,
  previous,
  received,
  net,
  currency,
}: {
  rows: BentoDay[];
  previous?: BentoDay[];
  received: string;
  net: string;
  currency: string;
}) {
  const [metric, setMetric] = useState<"received" | "net">("received"),
    [period, setPeriod] = useState<"day" | "week">("day");
  const points = bentoSeries(rows, metric, period).map(
    ({ start, end, value }) => ({
      label:
        start === end
          ? chartDate(start)
          : `${chartDate(start)} a ${chartDate(end)}`,
      value,
    }),
  );
  const comparison =
    period === "day" && previous?.some((row) => row[metric] !== null)
      ? bentoSeries(previous, metric, "day").map(({ start, value }) => ({
          label: chartDate(start),
          value,
        }))
      : undefined;
  const money = (value: number | null) =>
    value === null
      ? "Sem dados completos"
      : new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
          value,
        );
  return (
    <section
      className="bento-tile bento-revenue bento-financial"
      aria-label="Evolução financeira do período"
    >
      <header>
        <div>
          <h2>
            {metric === "received" ? "Recebimentos" : "Líquido após reembolsos"}
          </h2>
        </div>
        <span>{currency}</span>
      </header>
      <div className="bento-revenue-total">
        <strong>{money(Number(metric === "received" ? received : net))}</strong>
        <span>por data do pedido</span>
      </div>
      <div className="bento-chart-toolbar">
        <div
          className="bento-segments"
          role="group"
          aria-label="Indicador financeiro do bento"
        >
          {(
            [
              ["received", "Recebido"],
              ["net", "Líquido"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={metric === value}
              onClick={() => setMetric(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="bento-segments"
          role="group"
          aria-label="Agrupamento do gráfico"
        >
          {(
            [
              ["day", "Dia"],
              ["week", "Semana"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <FinancialTrend
        key={`${metric}-${period}`}
        points={points}
        previous={comparison}
        currency={currency}
        period={period}
      />
    </section>
  );
}
