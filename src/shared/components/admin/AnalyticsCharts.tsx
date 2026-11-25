"use client";
import { TrendingUp } from "lucide-react";
import type { AnalyticsTable } from "../../server/sales/analytics";
import { chartNumber, chartDate } from "../../lib/admin/infographic";
import InfographicTimeline from "./InfographicTimeline";
import InfographicRanking from "./InfographicRanking";
export const numberValue = chartNumber;
export const shortDate = chartDate;
type Format = (n: number | null) => string;
export function RevenueChart({
  table,
  money,
  currency,
  metricKey = "total_sales",
  metricLabel = "Vendas diárias",
  axisLabel,
  showTable = true,
  comparison,
}: {
  table: AnalyticsTable;
  money: Format;
  currency: string;
  metricKey?: string;
  metricLabel?: string;
  axisLabel?: string;
  showTable?: boolean;
  comparison?: { label: string; values: number[] };
}) {
  return (
    <div className="infographic-revenue">
      <InfographicTimeline
        rows={table.rows.map((row) => ({
          day: String(row.day ?? ""),
          value: numberValue(row[metricKey]),
        }))}
        label={axisLabel ?? `${metricLabel} · ${currency}`}
        format={money}
        initial="area"
        previous={comparison?.values}
      />
      {comparison && (
        <p className="infographic-note">Comparação: {comparison.label}</p>
      )}
      {showTable && (
        <details className="analytics-daily-values">
          <summary>Consultar valores diários</summary>
          <div className="analytics-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>{metricLabel}</th>
                  <th>Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    <td>{shortDate(row.day)}</td>
                    <td>{money(numberValue(row[metricKey]))}</td>
                    <td>{numberValue(row.orders) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
export function RankedBars({
  table,
  dimension,
  money,
}: {
  table: AnalyticsTable;
  dimension: string;
  money: Format;
}) {
  return (
    <InfographicRanking
      label="Comparação dos grupos"
      items={table.rows.map((row) => ({
        label: String(row[dimension] ?? "Não informado"),
        value: numberValue(row.total_sales),
        detail:
          dimension === "product_title"
            ? `${numberValue(row.net_items_sold) ?? "—"} unidades líquidas`
            : undefined,
      }))}
      format={money}
    />
  );
}
export function SessionJourney({ table }: { table: AnalyticsTable }) {
  const stages = [
    ["sessions", "Sessões"],
    ["sessions_with_cart_additions", "Adicionaram ao carrinho"],
    ["sessions_that_reached_checkout", "Chegaram ao checkout"],
    ["sessions_that_completed_checkout", "Concluíram a compra"],
  ];
  const values = stages.map(([key]) => numberValue(table.rows[0]?.[key])),
    base = values[0];
  const largest = Math.max(
    1,
    ...values.flatMap((v) => (v === null ? [] : [v])),
  );
  const consistent = values.every(
    (v, i) =>
      v === null ||
      (v >= 0 && (i === 0 || values[i - 1] === null || v <= values[i - 1]!)),
  );
  return (
    <div
      className="infographic-funnel"
      role="group"
      aria-label="Funil de conversão das sessões"
    >
      <div className="infographic-tools">
        <span className="infographic-kicker">JORNADA ATÉ A COMPRA</span>
        <span>Base: sessões</span>
      </div>
      {stages.map(([, label], i) => {
        const value = values[i],
          percent =
            base !== null && base > 0 && value !== null && value >= 0
              ? (100 * value) / base
              : null;
        return (
          <div className="infographic-funnel-stage" key={label}>
            <span className="infographic-rank-index">0{i + 1}</span>
            <div>
              <div className="infographic-rank-title">
                <span>{label}</span>
                <strong>
                  {value === null ? "—" : value.toLocaleString("pt-BR")}
                </strong>
              </div>
              <div className="infographic-funnel-track" aria-hidden="true">
                <span
                  style={{
                    width: `${(Math.max(0, value ?? 0) / largest) * 100}%`,
                  }}
                />
              </div>
            </div>
            <b>
              {percent === null
                ? "—"
                : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
            </b>
          </div>
        );
      })}
      <p className="infographic-note">
        {consistent
          ? "Proporções em relação ao total de sessões, conforme o Shopify Analytics."
          : "A fonte retornou etapas fora da sequência esperada. Os valores foram preservados; confira a tabela antes de interpretar a conversão."}
      </p>
    </div>
  );
}
export function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="analytics-empty">
      <TrendingUp size={28} aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
