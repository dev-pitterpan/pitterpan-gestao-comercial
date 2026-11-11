"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { shortDate, numberValue } from "./AnalyticsCharts";

type Point = { day: string; value: number | null };

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
  rows: Point[];
  format: (value: number) => string;
  controls?: ReactNode;
  previous?: number[];
  refunds?: boolean;
}) {
  const id = useId();
  const plot = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(620);
  const [selected, setSelected] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);
  const comparison = compare ? previous : undefined;
  const known = rows.flatMap(({ value }) => (value === null ? [] : [value]));
  const hasData = known.length > 0;
  useLayoutEffect(() => {
    const element = plot.current;
    if (!element || !hasData) return;
    const resize = () => {
      const measured = Math.floor(element.clientWidth);
      if (measured > 0) setWidth(measured);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasData]);

  const active = selected === null ? undefined : rows[selected];
  const height = 174;
  const left = width < 380 ? 40 : 48;
  const right = Math.max(left + 1, width - 14);
  const top = 12;
  const bottom = height - 28;
  const minValue = Math.min(0, ...known, ...(comparison ?? []));
  const maxValue = Math.max(0, ...known, ...(comparison ?? []));
  const rawStep = (maxValue - minValue || 1) / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = Math.max(
    0.01,
    ([1, 2, 2.5, 5, 10].find((unit) => unit * magnitude >= rawStep) ?? 10) *
      magnitude,
  );
  const low = Math.floor(minValue / step) * step;
  const high = Math.ceil(maxValue / step) * step || (low < 0 ? 0 : step);
  const increment = (right - left) / Math.max(1, rows.length);
  const x = (index: number) => left + (index + 0.5) * increment;
  const y = (value: number) =>
    bottom - ((value - low) * (bottom - top)) / (high - low);
  const axis = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 2,
  });
  const grid = Array.from(
    { length: Math.round((high - low) / step) + 1 },
    (_, index) => low + step * index,
  );
  const tickCount = width < 380 ? 3 : width < 530 ? 4 : 6;
  const ticks = [
    ...new Set(
      Array.from({ length: tickCount }, (_, index) =>
        Math.round((index * (rows.length - 1)) / (tickCount - 1)),
      ),
    ),
  ];
  const segments: { index: number; value: number }[][] = [];
  if (!refunds) {
    rows.forEach(({ value }, index) => {
      if (value === null) return;
      if (!index || rows[index - 1].value === null) segments.push([]);
      segments.at(-1)!.push({ index, value });
    });
  }

  return (
    <div className={`sales-trend${refunds ? " sales-trend--refunds" : ""}`}>
      <header className="sales-trend-head">
        <div>
          <h2>{title}</h2>
          <span>{label}</span>
          <strong>{total}</strong>
        </div>
        {controls && <div className="sales-trend-controls">{controls}</div>}
      </header>
      <div className="sales-trend-caption">
        <div className="sales-trend-key">
          <span>
            <i />
            {refunds ? "Dias com reembolso" : "Valores diários"}
          </span>
          {previous && (
            <label>
              <input
                type="checkbox"
                checked={compare}
                onChange={(event) => setCompare(event.target.checked)}
              />{" "}
              Comparar período anterior
            </label>
          )}
        </div>
        <span className="sales-trend-value" aria-live="polite">
          {active ? (
            <>
              <b>{shortDate(active.day)}</b>{" "}
              <span>
                {active.value === null ? "Sem dados" : format(active.value)}
              </span>
              {comparison && selected !== null && (
                <small>Anterior {format(comparison[selected])}</small>
              )}
            </>
          ) : (
            "Consulte os valores por dia"
          )}
        </span>
      </div>
      {hasData ? (
        <div className="sales-trend-plot" ref={plot}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            tabIndex={0}
            role="group"
            aria-label={`${label} por dia. Use as setas para consultar os valores.`}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const position =
                ((event.clientX - rect.left) * width) / rect.width;
              setSelected(
                Math.max(
                  0,
                  Math.min(
                    rows.length - 1,
                    Math.floor((position - left) / increment),
                  ),
                ),
              );
            }}
            onPointerLeave={() => setSelected(null)}
            onBlur={() => setSelected(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSelected(null);
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                return;
              event.preventDefault();
              const delta = event.key === "ArrowRight" ? 1 : -1;
              setSelected(
                Math.max(
                  0,
                  Math.min(
                    rows.length - 1,
                    (selected ?? (delta > 0 ? -1 : rows.length)) + delta,
                  ),
                ),
              );
            }}
          >
            <defs>
              <linearGradient id={id} x2="0" y2="1">
                <stop stopColor="var(--trend-color)" stopOpacity=".19" />
                <stop
                  offset="1"
                  stopColor="var(--trend-color)"
                  stopOpacity=".025"
                />
              </linearGradient>
            </defs>
            {grid.map((value, index) => (
              <g key={index}>
                <line
                  x1={left}
                  x2={right}
                  y1={y(value)}
                  y2={y(value)}
                  className={
                    Math.abs(value) < step / 100
                      ? "sales-trend-zero"
                      : "sales-trend-gridline"
                  }
                />
                <text x={left - 8} y={y(value) + 4} textAnchor="end">
                  {axis.format(Math.abs(value) < step / 100 ? 0 : value)}
                </text>
              </g>
            ))}
            {comparison && (
              <polyline
                className="sales-trend-previous"
                points={comparison
                  .map((value, index) => `${x(index)},${y(value)}`)
                  .join(" ")}
              />
            )}
            {refunds
              ? rows.map(
                  ({ value }, index) =>
                    value !== null &&
                    value !== 0 && (
                      <g key={index} className="sales-trend-refund">
                        <line
                          x1={x(index)}
                          x2={x(index)}
                          y1={y(0)}
                          y2={y(value)}
                        />
                        <circle cx={x(index)} cy={y(value)} r="4" />
                      </g>
                    ),
                )
              : segments.map((segment) => {
                  const first = segment[0];
                  const last = segment.at(-1)!;
                  const line = segment
                    .map(
                      ({ index, value }, i) =>
                        `${i ? "L" : "M"}${x(index)},${y(value)}`,
                    )
                    .join(" ");
                  return (
                    <g key={first.index}>
                      <path
                        d={`${line}L${x(last.index)},${y(0)}L${x(first.index)},${y(0)}Z`}
                        fill={`url(#${id})`}
                      />
                      <path className="sales-trend-line" d={line} />
                      {segment.length === 1 && (
                        <circle
                          className="sales-trend-dot"
                          cx={x(first.index)}
                          cy={y(first.value)}
                          r="4"
                        />
                      )}
                    </g>
                  );
                })}
            {ticks.map((index) => (
              <text
                key={index}
                x={x(index)}
                y={height - 8}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === rows.length - 1
                      ? "end"
                      : "middle"
                }
              >
                {shortDate(rows[index].day)}
              </text>
            ))}
            {active && selected !== null && (
              <g>
                <line
                  className="sales-trend-guide"
                  x1={x(selected)}
                  x2={x(selected)}
                  y1={top}
                  y2={bottom}
                />
                {active.value !== null && (
                  <circle
                    className="sales-trend-dot"
                    cx={x(selected)}
                    cy={y(active.value)}
                    r="4"
                  />
                )}
              </g>
            )}
          </svg>
        </div>
      ) : (
        <p className="analytics-empty">Sem valores no período.</p>
      )}
    </div>
  );
}

export function salesTrendPoints(
  rows: Record<string, unknown>[],
  metric: string,
) {
  return rows.map((row) => ({
    day: String(row.day),
    value: numberValue(row[metric]),
  }));
}
