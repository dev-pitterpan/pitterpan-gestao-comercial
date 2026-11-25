"use client";
import type { AnalyticsTable } from "../../server/sales/analytics";
import type { ReportColumn } from "../../lib/admin/shopify-reports";
import {
  chartNumber,
  chartDate,
  shareableMetric,
} from "../../lib/admin/infographic";
import InfographicTimeline from "./InfographicTimeline";
import InfographicRanking from "./InfographicRanking";
export default function InteractiveColumns({
  table,
  metric,
  dimensions,
  series,
  format,
}: {
  table: AnalyticsTable;
  metric: ReportColumn;
  dimensions?: ReportColumn[];
  series?: boolean;
  format: (value: unknown) => string;
}) {
  return series ? (
    <InfographicTimeline
      key={metric.key}
      rows={table.rows.map((row) => ({
        day: String(row.day ?? ""),
        value: chartNumber(row[metric.key]),
      }))}
      label={metric.label}
      format={format}
    />
  ) : (
    <InfographicRanking
      key={metric.key}
      label={metric.label}
      items={table.rows.map((row) => ({
        label:
          (dimensions ?? [])
            .map((d) => String(row[d.key] ?? "Não informado"))
            .join(" · ") || chartDate(row.day),
        value: chartNumber(row[metric.key]),
      }))}
      format={format}
      participation={shareableMetric(metric)}
    />
  );
}
