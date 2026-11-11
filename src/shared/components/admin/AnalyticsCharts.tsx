"use client";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import type { AnalyticsTable } from "../../server/sales/analytics";
export const numberValue = (v: unknown) =>
  v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v))
    ? Number(v)
    : null;
export const shortDate = (v: unknown) => {
  const text = String(v ?? "");
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}` : text || "Sem data";
};
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
  compact = false,
}: {
  table: AnalyticsTable;
  money: Format;
  currency: string;
  metricKey?: string;
  metricLabel?: string;
  axisLabel?: string;
  showTable?: boolean;
  compact?: boolean;
  comparison?: { label: string; values: number[] };
}) {
  const id = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);
  const rows = table.rows;
  const values = rows.map((r) => numberValue(r[metricKey]));
  const valid = values.filter((v): v is number => v !== null);
  const chart = useRef<SVGSVGElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(760);
  const hasValues = valid.length > 0;
  useLayoutEffect(() => {
    if (!compact || !hasValues || !chart.current) return;
    const element = chart.current;
    function measure() {
      const width = Math.round(element.getBoundingClientRect().width);
      if (width > 0) setMeasuredWidth(width);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [compact, hasValues]);
  if (!hasValues)
    return (
      <p className="analytics-empty">
        Não há valores disponíveis para este indicador no período.
      </p>
    );
  const comparisonValues = comparison?.values ?? [];
  const min = Math.min(0, ...valid, ...comparisonValues),
    max = Math.max(0, ...valid, ...comparisonValues),
    span = max - min || 1;
  const width = compact ? measuredWidth : 760;
  const height = compact ? 216 : 280;
  const left = compact ? 46 : 78;
  const right = width - (compact ? 12 : 34);
  const top = compact ? 30 : 44;
  const bottom = compact ? 181 : 232;
  const tickCount = compact && width < 420 ? 4 : 7;
  const step = (right - left) / Math.max(1, rows.length - (compact ? 0 : 1));
  const firstPoint = compact ? left + step / 2 : left;
  const x = (i: number) => firstPoint + i * step;
  const y = (n: number) => bottom - ((n - min) * (bottom - top)) / span;
  const barWidth = Math.min(24, step * 0.68);
  const series = compact
    ? values.map((value, index) => {
        if (value === null) return null;
        let sum = 0;
        let count = 0;
        for (let day = index; day >= Math.max(0, index - 6); day--) {
          const sample = values[day];
          if (sample === null) break;
          sum += sample;
          count++;
        }
        return count > 1 ? sum / count : null;
      })
    : values;
  const segments: { i: number; v: number }[][] = [];
  series.forEach((v, i) => {
    if (v === null) return;
    if (i === 0 || series[i - 1] === null) segments.push([]);
    segments.at(-1)!.push({ i, v });
  });
  const chosen = active === null ? null : rows[active];
  const ticks = [
    ...new Set(
      Array.from({ length: tickCount }, (_, i) =>
        Math.round((i * Math.max(0, rows.length - 1)) / (tickCount - 1)),
      ),
    ),
  ];
  return (
    <div className="analytics-chart-wrap">
      <div className="analytics-chart-readout" aria-live="polite">
        <span className="analytics-legend">
          <i /> {metricLabel}
          {compact && series.some((value) => value !== null) && (
            <span className="analytics-trend-legend">
              · Média móvel de até 7 dias
            </span>
          )}
          {comparison && <span> · Linha tracejada: {comparison.label}</span>}
        </span>
        <span>
          {chosen ? (
            <>
              <b>{shortDate(chosen.day)}</b> ·{" "}
              {money(numberValue(chosen[metricKey]))}
              {active !== null && comparison && (
                <> · Anterior: {money(comparison.values[active] ?? null)}</>
              )}
            </>
          ) : (
            "Passe pelo gráfico para explorar"
          )}
        </span>
      </div>
      <svg
        ref={chart}
        viewBox={`0 0 ${width} ${height}`}
        className="analytics-revenue-chart"
        data-compact={compact || undefined}
        role="group"
        tabIndex={0}
        aria-label={`${metricLabel} por dia. Use as setas esquerda e direita para consultar os valores.`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            setActive((i) =>
              Math.max(
                0,
                Math.min(
                  rows.length - 1,
                  (i ?? (e.key === "ArrowRight" ? -1 : rows.length)) +
                    (e.key === "ArrowRight" ? 1 : -1),
                ),
              ),
            );
          }
          if (e.key === "Escape") setActive(null);
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const position = ((e.clientX - rect.left) * width) / rect.width;
          setActive(
            Math.max(
              0,
              Math.min(
                rows.length - 1,
                Math.round((position - firstPoint) / step),
              ),
            ),
          );
        }}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#397bc4" stopOpacity=".25" />
            <stop offset="100%" stopColor="#397bc4" stopOpacity=".015" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const v = min + (span * i) / 4;
          return (
            <g key={i}>
              <line
                x1={left}
                x2={right}
                y1={y(v)}
                y2={y(v)}
                stroke="#e1e9f2"
                strokeDasharray="4 6"
              />
              <text x={left - (compact ? 8 : 12)} y={y(v) + 4} textAnchor="end">
                {new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(v)}
              </text>
            </g>
          );
        })}
        <text x={left} y={compact ? 13 : 22}>
          {axisLabel || `Valores em ${currency}`}
        </text>
        {min < 0 && (
          <line x1={left} x2={right} y1={y(0)} y2={y(0)} stroke="#9eafc5" />
        )}
        {comparisonValues.length > 1 && (
          <polyline
            fill="none"
            stroke="#617e9b"
            strokeWidth="2"
            strokeDasharray="6 5"
            points={comparisonValues
              .map((value, index) => `${x(index)},${y(value)}`)
              .join(" ")}
          />
        )}
        {comparisonValues.length === 1 && (
          <circle
            cx={x(0)}
            cy={y(comparisonValues[0])}
            r="5"
            fill="none"
            stroke="#617e9b"
            strokeWidth="2"
          />
        )}
        {compact &&
          values.map((value, index) => {
            if (value === null || value === 0) return null;
            return (
              <rect
                key={index}
                x={x(index) - barWidth / 2}
                y={Math.min(y(0), y(value))}
                width={barWidth}
                height={Math.abs(y(value) - y(0))}
                rx={Math.min(3, barWidth / 3)}
                fill={
                  value < 0
                    ? "#d86e81"
                    : metricKey === "refunded"
                      ? "#e6a854"
                      : "#55ab9d"
                }
              />
            );
          })}
        {segments.map((s, i) => {
          const path = s
            .map((p, j) => `${j ? "L" : "M"}${x(p.i)},${y(p.v)}`)
            .join(" ");
          return (
            <g key={i}>
              {!compact && (
                <path
                  d={`${path} L${x(s.at(-1)!.i)},${y(0)} L${x(s[0].i)},${y(0)} Z`}
                  fill={`url(#${id})`}
                />
              )}
              <path
                d={path}
                fill="none"
                stroke="#356fb3"
                strokeWidth={compact ? 2 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {!compact && s.length === 1 && (
                <circle cx={x(s[0].i)} cy={y(s[0].v)} r="4" fill="#356fb3" />
              )}
            </g>
          );
        })}
        {ticks.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={compact ? 202 : 262}
            textAnchor={
              i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle"
            }
          >
            {shortDate(rows[i].day)}
          </text>
        ))}
        {active !== null && (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={top - 6}
              y2={bottom}
              stroke="#829bbd"
              strokeDasharray="4 4"
            />
            {values[active] !== null && (
              <circle
                cx={x(active)}
                cy={y(values[active]!)}
                r="6"
                fill="#ffd51a"
                stroke="#2f5597"
                strokeWidth="3"
              />
            )}
          </g>
        )}
      </svg>
      {showTable && (
        <details className="analytics-daily-values">
          <summary>Consultar tabela de vendas diárias</summary>
          <div className="analytics-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Vendas</th>
                  <th>Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{shortDate(r.day)}</td>
                    <td>{money(numberValue(r[metricKey]))}</td>
                    <td>{numberValue(r.orders) ?? "—"}</td>
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
  const [expanded, setExpanded] = useState(false);
  const rows = table.rows;
  const max =
    Math.max(
      0,
      ...rows.map((r) => Math.abs(numberValue(r.total_sales) ?? 0)),
    ) || 1;
  return (
    <>
      <ol className="analytics-ranking">
        {rows.slice(0, expanded ? rows.length : 5).map((r, i) => {
          const n = numberValue(r.total_sales);
          return (
            <li key={i}>
              <span className="analytics-rank-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="analytics-rank-caption">
                  <span title={String(r[dimension] ?? "Não informado")}>
                    {String(r[dimension] ?? "Não informado")}
                  </span>
                  <strong>{money(n)}</strong>
                </div>
                <div className="analytics-bar-track" aria-hidden="true">
                  <span
                    className={n !== null && n < 0 ? "is-negative" : ""}
                    style={{ width: `${(Math.abs(n ?? 0) / max) * 100}%` }}
                  />
                </div>
                {dimension === "product_title" && (
                  <small>
                    {numberValue(r.net_items_sold) ?? "—"} unidades líquidas
                  </small>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {rows.length > 5 && (
        <button
          className="analytics-expand"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}{" "}
          {expanded ? "Mostrar menos" : `Ver os ${rows.length} resultados`}
        </button>
      )}
    </>
  );
}
export function SessionJourney({ table }: { table: AnalyticsTable }) {
  const stages = [
    ["sessions", "Sessões"],
    ["sessions_with_cart_additions", "Adicionaram ao carrinho"],
    ["sessions_that_reached_checkout", "Chegaram ao checkout"],
    ["sessions_that_completed_checkout", "Concluíram a compra"],
  ];
  const total = numberValue(table.rows[0]?.sessions);
  return (
    <div className="analytics-journey">
      {stages.map(([key, label], i) => {
        const n = numberValue(table.rows[0]?.[key]);
        const percent =
          total !== null && total > 0 && n !== null ? (n / total) * 100 : null;
        return (
          <div key={key}>
            <span className="analytics-step">0{i + 1}</span>
            <span>{label}</span>
            <strong>{n === null ? "—" : n.toLocaleString("pt-BR")}</strong>
            <div className="analytics-bar-track" aria-hidden="true">
              <span
                style={{
                  width: `${Math.min(100, Math.max(0, percent ?? 0))}%`,
                }}
              />
            </div>
            <small>
              {percent === null
                ? "Proporção indisponível"
                : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% das sessões`}
            </small>
          </div>
        );
      })}
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
