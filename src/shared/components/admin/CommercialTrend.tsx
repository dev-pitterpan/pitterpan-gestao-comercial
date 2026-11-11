"use client";

import { useState } from "react";
import { RevenueChart } from "./AnalyticsCharts";
import type { readSalesFinance } from "../../server/sales/repository";
import { shiftDate, todayDate } from "../../lib/admin/date-range";

export default function CommercialTrend({
  sales,
  previousDaily,
}: {
  sales: Awaited<ReturnType<typeof readSalesFinance>>;
  previousDaily: Record<string, string>[] | null;
}) {
  const [metric, setMetric] = useState<"net" | "paid">("net");
  const [selectedCurrency, setCurrency] = useState("BRL");
  const currency =
    sales.totals.find((row) => row.currency === selectedCurrency)?.currency ??
    sales.totals[0]?.currency;
  if (!currency)
    return (
      <p className="admin-inline-note">
        Nenhum pedido importado neste período.
      </p>
    );

  const daily = new Map(
    sales.daily
      .filter((row) => row.currency === currency)
      .map((row) => [row.day, row]),
  );
  const completedDay =
    sales.state?.completed_at && !sales.state.until_at
      ? todayDate(sales.timezone, new Date(sales.state.completed_at))
      : "";
  const rows = [];
  for (
    let day = sales.window.start;
    day <= sales.window.end;
    day = shiftDate(day, 1)
  ) {
    rows.push(
      daily.get(day) ?? {
        day,
        net: day < completedDay ? "0" : null,
        paid: day < completedDay ? "0" : null,
      },
    );
  }
  const previous = new Map(
    previousDaily
      ?.filter((row) => row.currency === currency)
      .map((row) => [row.day, row]),
  );
  const comparison = previousDaily
    ? {
        label: "Período anterior",
        values: rows.map(({ day }) =>
          Number(previous.get(shiftDate(day, -rows.length))?.[metric] ?? 0),
        ),
      }
    : undefined;
  const format = new Intl.NumberFormat(
    "pt-BR",
    metric === "net"
      ? { style: "currency", currency }
      : { maximumFractionDigits: 0 },
  );
  return (
    <>
      <div className="commercial-overview-controls">
        <div
          role="group"
          aria-label="Indicador do gráfico"
          className="commercial-overview-controls"
        >
          <button
            type="button"
            className="admin-button"
            aria-pressed={metric === "net"}
            onClick={() => setMetric("net")}
          >
            Valor recebido
          </button>
          <button
            type="button"
            className="admin-button"
            aria-pressed={metric === "paid"}
            onClick={() => setMetric("paid")}
          >
            Pedidos pagos
          </button>
        </div>
        {sales.totals.length > 1 && (
          <select
            aria-label="Moeda do gráfico"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {sales.totals.map(({ currency }) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        )}
      </div>
      <RevenueChart
        key={currency}
        table={{ columns: [], rows }}
        currency={currency}
        showTable={false}
        compact
        comparison={comparison}
        metricKey={metric}
        metricLabel={
          metric === "net" ? "Recebido após reembolsos" : "Pedidos pagos"
        }
        axisLabel={metric === "net" ? currency : "Pedidos"}
        money={(value) => (value === null ? "—" : format.format(value))}
      />
    </>
  );
}
