"use client";

import { useState } from "react";
import SalesTrendChart, { salesTrendPoints } from "./SalesTrendChart";
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
  const label = metric === "net" ? "Líquido após estornos" : "Pedidos pagos";
  const total = sales.totals.find((row) => row.currency === currency);
  return (
    <SalesTrendChart
      key={currency}
      title="Evolução das vendas"
      label={label}
      total={format.format(Number(total?.[metric] ?? 0))}
      rows={salesTrendPoints(rows, metric)}
      format={(value) => format.format(value)}
      previous={comparison?.values}
      controls={
        <>
          <div
            className="sales-trend-segments"
            role="group"
            aria-label="Indicador do gráfico"
          >
            <button
              type="button"
              aria-pressed={metric === "net"}
              onClick={() => setMetric("net")}
            >
              Líquido
            </button>
            <button
              type="button"
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
              onChange={(event) => setCurrency(event.target.value)}
            >
              {sales.totals.map(({ currency }) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          )}
        </>
      }
    />
  );
}
