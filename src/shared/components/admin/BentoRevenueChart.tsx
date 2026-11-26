"use client";
import { useState } from "react";
import { bentoSeries, type BentoDay } from "../../lib/admin/bento-series";
import { chartDate } from "../../lib/admin/infographic";
import InfographicTimeline from "./InfographicTimeline";
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
  const comparison =
    period === "day" && previous?.some((row) => row[metric] !== null)
      ? bentoSeries(previous, metric, "day").map((entry) => entry.value)
      : undefined;
  const money = (value: number | null) =>
    value === null
      ? "Sem dados completos"
      : new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
          value,
        );
  return (
    <section
      className="bento-tile bento-revenue bento-infographic"
      aria-label="Evolução financeira do período"
    >
      <header>
        <div>
          <span className="bento-eyebrow">EVOLUÇÃO FINANCEIRA</span>
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
      <InfographicTimeline
        key={`${metric}-${period}`}
        rows={bentoSeries(rows, metric, period).map((row) => ({
          day:
            row.start === row.end
              ? row.start
              : `${chartDate(row.start)} — ${chartDate(row.end)}`,
          value: row.value,
        }))}
        previous={comparison}
        initial="area"
        label={metric === "received" ? "Recebido" : "Líquido"}
        format={money}
      />
    </section>
  );
}
