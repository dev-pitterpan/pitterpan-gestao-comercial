"use client";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { ChartColumn, Mountain } from "lucide-react";
import { chartDate, chartDomain } from "../../lib/admin/infographic";
export type TimelinePoint = { day: string; value: number | null };
export default function InfographicTimeline({
  rows,
  format,
  label,
  previous,
  initial = "columns",
  coral = false,
}: {
  rows: TimelinePoint[];
  format: (value: number | null) => string;
  label: string;
  previous?: (number | null)[];
  initial?: "columns" | "area";
  coral?: boolean;
}) {
  const [mode, setMode] = useState(initial),
    [active, setActive] = useState<number | null>(null),
    [compare, setCompare] = useState(false),
    [width, setWidth] = useState(600);
  const plot = useRef<HTMLDivElement>(null),
    id = useId();
  useLayoutEffect(() => {
    const node = plot.current;
    if (!node) return;
    const measure = () => setWidth(Math.max(240, node.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const comparison = compare ? previous?.slice(0, rows.length) : undefined;
  const { low, high, hasData } = chartDomain([
    ...rows.map((r) => r.value),
    ...(comparison ?? []),
  ]);
  const left = 45,
    right = width - 12,
    top = 16,
    bottom = 218,
    step = (right - left) / Math.max(1, rows.length);
  const x = (i: number) => left + (i + 0.5) * step,
    y = (value: number) =>
      bottom - ((value - low) / (high - low)) * (bottom - top);
  const axis = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const chosen = active === null ? undefined : rows[active];
  const paths = (points: (number | null)[]) => {
    const segments: { index: number; value: number }[][] = [];
    points.forEach((value, index) => {
      if (value === null) return;
      if (index === 0 || points[index - 1] === null) segments.push([]);
      segments.at(-1)!.push({ index, value });
    });
    return segments;
  };
  const ticks = [
    ...new Set(
      Array.from({ length: width < 400 ? 3 : 5 }, (_, i) =>
        Math.round((i * (rows.length - 1)) / (width < 400 ? 2 : 4)),
      ),
    ),
  ].filter((i) => i >= 0);
  return (
    <div className={`infographic-timeline${coral ? " is-coral" : ""}`}>
      <div className="infographic-tools">
        <span className="infographic-kicker">{label}</span>
        <div
          className="infographic-switch"
          role="group"
          aria-label="Forma do gráfico"
        >
          <button
            type="button"
            aria-pressed={mode === "columns"}
            onClick={() => setMode("columns")}
          >
            <ChartColumn size={14} />
            Colunas
          </button>
          <button
            type="button"
            aria-pressed={mode === "area"}
            onClick={() => setMode("area")}
          >
            <Mountain size={14} />
            Área
          </button>
        </div>
      </div>
      <div className="infographic-readout" aria-live="polite">
        <span>{chosen ? chartDate(chosen.day) : "LEITURA DO PERÍODO"}</span>
        <strong>
          {chosen ? format(chosen.value) : "Explore os resultados"}
        </strong>
        <small>
          {chosen && comparison && active !== null
            ? `Anterior: ${format(comparison[active] ?? null)}`
            : "Selecione no gráfico · setas para navegar"}
        </small>
      </div>
      {previous && (
        <label className="infographic-compare">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
          />{" "}
          Comparar período anterior · linha tracejada
        </label>
      )}
      <div className="infographic-plot" ref={plot}>
        {hasData ? (
          <svg
            viewBox={`0 0 ${width} 255`}
            role="group"
            tabIndex={0}
            aria-label={`${label}. Use as setas para consultar os valores.`}
            onPointerMove={(e) => {
              const box = e.currentTarget.getBoundingClientRect();
              setActive(
                Math.max(
                  0,
                  Math.min(
                    rows.length - 1,
                    Math.floor(
                      (((e.clientX - box.left) * width) / box.width - left) /
                        step,
                    ),
                  ),
                ),
              );
            }}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const position =
                ((event.clientX - rect.left) * width) / rect.width;
              setActive(
                Math.max(
                  0,
                  Math.min(
                    rows.length - 1,
                    Math.floor((position - left) / step),
                  ),
                ),
              );
            }}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setActive(null);
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const delta = e.key === "ArrowRight" ? 1 : -1;
                setActive((i) =>
                  Math.max(
                    0,
                    Math.min(
                      rows.length - 1,
                      (i ?? (delta > 0 ? -1 : rows.length)) + delta,
                    ),
                  ),
                );
              }
            }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor={coral ? "#c4473d" : "#6999bd"} />
                <stop
                  offset="1"
                  stopColor={coral ? "#3f3a42" : "#286da8"}
                  stopOpacity=".32"
                />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => {
              const value = low + ((high - low) * i) / 3;
              return (
                <g key={i}>
                  <line
                    x1={left}
                    x2={right}
                    y1={y(value)}
                    y2={y(value)}
                    className="infographic-grid"
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
              className="infographic-zero"
            />
            {mode === "columns"
              ? rows.map((r, i) =>
                  r.value === null ? (
                    <circle
                      key={i}
                      cx={x(i)}
                      cy={y(0) - 4}
                      r="2"
                      fill="#76828e"
                    />
                  ) : (
                    <g key={i}>
                      <rect
                        x={x(i) - Math.min(20, step * 0.6) / 2}
                        width={Math.min(20, step * 0.6)}
                        y={Math.min(y(0), y(r.value))}
                        height={Math.abs(y(r.value) - y(0))}
                        rx="4"
                        fill={r.value < 0 ? "#c4473d" : `url(#${id})`}
                        opacity={active === null || active === i ? 1 : 0.45}
                      />
                      {r.value !== 0 && (
                        <circle
                          cx={x(i)}
                          cy={y(r.value)}
                          r={active === i ? 4 : 2}
                          fill={r.value < 0 || coral ? "#c4473d" : "#a1ceeb"}
                        />
                      )}
                    </g>
                  ),
                )
              : paths(rows.map((r) => r.value)).map((s, i) => {
                  const line = s
                    .map(
                      (p, j) => `${j ? "L" : "M"}${x(p.index)},${y(p.value)}`,
                    )
                    .join(" ");
                  return (
                    <g key={i}>
                      <path
                        d={`${line} L${x(s.at(-1)!.index)},${y(0)} L${x(s[0].index)},${y(0)} Z`}
                        fill={`url(#${id})`}
                        opacity=".65"
                      />
                      <path
                        d={line}
                        fill="none"
                        stroke={coral ? "#c4473d" : "#a1ceeb"}
                        strokeWidth="2"
                      />
                      {s.length === 1 && (
                        <circle
                          cx={x(s[0].index)}
                          cy={y(s[0].value)}
                          r="3"
                          fill="#a1ceeb"
                        />
                      )}
                    </g>
                  );
                })}
            {comparison &&
              paths(comparison).map((s, i) => (
                <polyline
                  key={i}
                  points={s.map((p) => `${x(p.index)},${y(p.value)}`).join(" ")}
                  fill="none"
                  stroke="#c0c8ce"
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                />
              ))}
            {ticks.map((i) => (
              <text
                key={i}
                x={x(i)}
                y="244"
                textAnchor={
                  i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle"
                }
              >
                {chartDate(rows[i].day)}
              </text>
            ))}
            {chosen && active !== null && (
              <g>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={top}
                  y2={bottom}
                  stroke="#76828e"
                  strokeDasharray="3 5"
                />
                {chosen.value !== null && (
                  <circle
                    cx={x(active)}
                    cy={y(chosen.value)}
                    r="5"
                    fill="#c4473d"
                    stroke="#0a0c12"
                    strokeWidth="2"
                  />
                )}
              </g>
            )}
          </svg>
        ) : (
          <p className="infographic-empty">
            Sem valores disponíveis neste período.
          </p>
        )}
      </div>
      {rows.some((row) => row.value === null) && (
        <p className="infographic-note">
          Marcadores cinza e lacunas indicam dados ausentes; não representam
          zero.
        </p>
      )}
    </div>
  );
}
