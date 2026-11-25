"use client";
import { useState, useId, useRef, useLayoutEffect } from "react";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { bentoSeries, type BentoDay } from "../../lib/admin/bento-series";
const short = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
export default function BentoRevenueChart({
  rows,
  received,
  net,
  currency,
}: {
  rows: BentoDay[];
  received: string;
  net: string;
  currency: string;
}) {
  const [metric, setMetric] = useState<"received" | "net">("received");
  const [period, setPeriod] = useState<"day" | "week">("day");
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(620);
  const plot = useRef<HTMLDivElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    const node = plot.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setWidth(Math.max(240, node.clientWidth)),
    );
    observer.observe(node);
    setWidth(Math.max(240, node.clientWidth));
    return () => observer.disconnect();
  }, []);
  const points = bentoSeries(rows, metric, period);
  const money = (value: number | string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
      Number(value),
    );
  const values = points.flatMap((point) =>
    point.value === null ? [] : [point.value],
  );
  const low = Math.min(0, ...values),
    high = Math.max(0, ...values, 1);
  const height = 218,
    top = 12,
    bottom = 184,
    left = 45,
    right = width - 9;
  const step = (right - left) / Math.max(1, points.length);
  const y = (value: number) =>
    bottom - ((value - low) / (high - low)) * (bottom - top);
  const active = selected === null ? null : points[selected];
  const ticks = [
    ...new Set(
      Array.from({ length: width < 420 ? 3 : 5 }, (_, i) =>
        Math.round((i * (points.length - 1)) / (width < 420 ? 2 : 4)),
      ),
    ),
  ].filter((i) => i >= 0);
  const axis = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return (
    <section
      className="bento-tile bento-revenue"
      aria-label="Evolução financeira em colunas"
    >
      <header>
        <div>
          <span className="bento-eyebrow">DESEMPENHO NO PERÍODO</span>
          <h2>
            {metric === "received" ? "Recebimentos" : "Líquido após reembolsos"}
          </h2>
        </div>
        <ArrowUpRight size={18} aria-hidden="true" />
      </header>
      <div className="bento-revenue-total">
        <strong>{money(metric === "received" ? received : net)}</strong>
        <span>{currency} · por data do pedido</span>
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
              onClick={() => {
                setMetric(value);
                setSelected(null);
              }}
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
              onClick={() => {
                setPeriod(value);
                setSelected(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div ref={plot} className="bento-column-plot">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Colunas financeiras. Use as setas para consultar cada valor."
          tabIndex={0}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) * width) / rect.width;
            setSelected(
              Math.max(
                0,
                Math.min(points.length - 1, Math.floor((x - left) / step)),
              ),
            );
          }}
          onPointerLeave={() => setSelected(null)}
          onBlur={() => setSelected(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelected(null);
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              const delta = event.key === "ArrowRight" ? 1 : -1;
              setSelected((current) =>
                Math.max(
                  0,
                  Math.min(
                    points.length - 1,
                    (current ?? (delta > 0 ? -1 : points.length)) + delta,
                  ),
                ),
              );
            }
          }}
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#99bddd" />
              <stop offset="1" stopColor="#286da8" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((fraction) => {
            const value = low + (high - low) * fraction;
            return (
              <g key={fraction}>
                <line
                  x1={left}
                  x2={right}
                  y1={y(value)}
                  y2={y(value)}
                  className="bento-column-grid"
                />
                <text x={left - 8} y={y(value) + 4} textAnchor="end">
                  {axis.format(value)}
                </text>
              </g>
            );
          })}
          <line
            x1={left}
            x2={right}
            y1={y(0)}
            y2={y(0)}
            className="bento-column-baseline"
          />
          {points.map((point, index) => {
            const x = left + index * step + step * 0.18;
            const barWidth = Math.max(1, step * 0.64);
            return point.value === null ? (
              <rect
                key={point.start}
                x={x}
                y={bottom - 4}
                width={barWidth}
                height="4"
                rx="2"
                className="bento-column-unknown"
              />
            ) : (
              <g key={point.start}>
                <rect
                  x={x}
                  y={Math.min(y(point.value), y(0))}
                  width={barWidth}
                  height={Math.max(
                    point.value === 0 ? 0 : 2,
                    Math.abs(y(point.value) - y(0)),
                  )}
                  rx={Math.min(6, barWidth / 2)}
                  fill={point.value < 0 ? "#c4473d" : `url(#${id})`}
                  opacity={selected === null || selected === index ? 1 : 0.35}
                />
                {selected === index && (
                  <circle
                    cx={x + barWidth / 2}
                    cy={y(point.value) - 6}
                    r="3"
                    fill="#fff"
                  />
                )}
              </g>
            );
          })}
          {ticks.map((index) => (
            <text
              key={index}
              x={left + (index + 0.5) * step}
              y={height - 8}
              textAnchor={
                index === 0
                  ? "start"
                  : index === points.length - 1
                    ? "end"
                    : "middle"
              }
            >
              {short(points[index]?.start ?? "")}
            </text>
          ))}
        </svg>
      </div>
      <div className="bento-chart-reading" aria-live="polite">
        <CalendarDays size={13} />
        {active ? (
          <>
            <span>
              {short(active.start)}
              {active.end !== active.start ? ` — ${short(active.end)}` : ""}
            </span>
            <strong>
              {active.value === null
                ? "Sem dados completos"
                : money(active.value)}
            </strong>
          </>
        ) : (
          <span>
            {points.some((point) => point.value === null)
              ? "Cinza: dados incompletos. Selecione uma coluna."
              : "Selecione uma coluna para consultar o valor"}
          </span>
        )}
      </div>
    </section>
  );
}
