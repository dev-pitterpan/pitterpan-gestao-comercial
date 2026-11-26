"use client";
import { TrendingUp } from "lucide-react";
import type { AnalyticsTable } from "../../server/sales/analytics";
import { chartNumber, chartDate } from "../../lib/admin/infographic";
import InfographicTimeline from "./InfographicTimeline";
import InfographicRanking from "./InfographicRanking";
import InfographicJourney from "./InfographicJourney";
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
  return <InfographicJourney table={table} />;
}
export function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="analytics-empty">
      <TrendingUp size={28} aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
