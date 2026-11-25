"use client";
import type { ReactNode } from "react";
import { chartNumber } from "../../lib/admin/infographic";
import InfographicTimeline, { type TimelinePoint } from "./InfographicTimeline";
export default function SalesTrendChart({
  title,
  label,
  total,
  rows,
  format,
  controls,
  previous,
  refunds = false,
}: {
  title: string;
  label: string;
  total: string;
  rows: TimelinePoint[];
  format: (value: number) => string;
  controls?: ReactNode;
  previous?: number[];
  refunds?: boolean;
  height?: number;
  combined?: boolean;
}) {
  return (
    <section className="infographic-finance-tile" aria-label={title}>
      <header>
        <div>
          <span className="infographic-kicker">{title}</span>
          <h2>{label}</h2>
          <strong>{total}</strong>
        </div>
        <div>{controls}</div>
      </header>
      <InfographicTimeline
        rows={rows}
        label={label}
        format={(value) => (value === null ? "Sem dados" : format(value))}
        previous={previous}
        coral={refunds}
      />
    </section>
  );
}
export function salesTrendPoints(
  rows: Record<string, unknown>[],
  metric: string,
) {
  return rows.map((row) => ({
    day: String(row.day),
    value: chartNumber(row[metric]),
  }));
}
