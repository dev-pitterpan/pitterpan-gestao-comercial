"use client";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { ChartColumn, ChartSpline } from "lucide-react";
import { chartDate, chartDomain } from "../../lib/admin/infographic";
export type TimelinePoint = { day: string; value: number | null };
export default function InfographicTimeline({
  rows,
  format,
  label,
  previous,
  coral = false,
}: {
  rows: TimelinePoint[];
  format: (value: number | null) => string;
  label: string;
  previous?: (number | null)[];
  coral?: boolean;
}) {
  const [mode, setMode] = useState<"area" | "columns">("area"),
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
  const peak = rows.reduce<TimelinePoint | undefined>(
    (best, row) =>
      row.value !== null && (!best || row.value > best.value!) ? row : best,
    undefined,
  );
  const reading = chosen ?? peak;
  const series = (values: (number | null)[]) => {
    const segments: { x: number; y: number }[][] = [];
    values.forEach((value, index) => {
      if (value === null) return;
      if (index === 0 || values[index - 1] === null) segments.push([]);
      segments.at(-1)!.push({ x: x(index), y: y(value) });
    });
    return segments;
  };
  // Horizontal tangents keep the curve within each pair of real values.
  const curve = (segment: { x: number; y: number }[]) =>
    segment
      .map((point, index) => {
        if (index === 0) return `M${point.x},${point.y}`;
        const prior = segment[index - 1];
        const middle = (prior.x + point.x) / 2;
        return `C${middle},${prior.y} ${middle},${point.y} ${point.x},${point.y}`;
      })
      .join(" ");
  const baseline = y(0);
  const color = coral ? "#c8495b" : "#315bd7";
  const ticks = [
    ...new Set(
      Array.from({ length: width < 400 ? 3 : 5 }, (_, i) =>
        Math.round((i * (rows.length - 1)) / (width < 400 ? 2 : 4)),
      ),
    ),
  ].filter((i) => i >= 0);
  return (
    <div
      className={`infographic-timeline reference-timeline${coral ? " is-coral" : ""}`}
    >
      <div className="infographic-tools">
        <span className="infographic-kicker">{label}</span>
        <div
          className="infographic-switch"
          role="group"
          aria-label="Forma do gráfico"
        >
          <button
            type="button"
            aria-pressed={mode === "area"}
            onClick={() => setMode("area")}
          >
            <ChartSpline size={15} aria-hidden="true" />
            Área
          </button>
          <button
            type="button"
            aria-pressed={mode === "columns"}
            onClick={() => setMode("columns")}
          >
            <ChartColumn size={15} aria-hidden="true" />
            Colunas
          </button>
        </div>
      </div>
      <div className="infographic-readout" aria-live="polite">
        <span>
          {chosen
            ? chartDate(chosen.day)
            : peak
              ? `Maior valor · ${chartDate(peak.day)}`
              : "LEITURA DO PERÍODO"}
        </span>
        <strong>
          {reading ? format(reading.value) : "Sem valores disponíveis"}
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
                <stop
                  stopColor={color}
                  stopOpacity={mode === "area" ? ".20" : ".95"}
                />
                <stop
                  offset="1"
                  stopColor={color}
                  stopOpacity={mode === "area" ? ".04" : ".60"}
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
              ? rows.map(({ value }, i) => {
                  if (value === null || value === 0) return null;
                  const height = Math.abs(y(value) - baseline);
                  const barWidth = Math.min(24, step * 0.57);
                  return (
                    <rect
                      key={i}
                      x={x(i) - barWidth / 2}
                      width={barWidth}
                      y={Math.min(baseline, y(value))}
                      height={height}
                      rx={Math.min(5, height / 2)}
                      fill={value < 0 ? "#c8495b" : `url(#${id})`}
                      opacity={active === null || active === i ? 1 : 0.55}
                    />
                  );
                })
              : series(rows.map((row) => row.value)).map((segment, i) => {
                  const first = segment[0];
                  const last = segment.at(-1)!;
                  const line = curve(segment);
                  return segment.length === 1 ? (
                    <circle
                      key={i}
                      cx={first.x}
                      cy={first.y}
                      r="4"
                      fill={color}
                    />
                  ) : (
                    <g key={i}>
                      <path
                        d={`${line} L${last.x},${baseline} L${first.x},${baseline} Z`}
                        fill={`url(#${id})`}
                      />
                      <path
                        d={line}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}
            {comparison &&
              series(comparison).map((segment, i) =>
                segment.length === 1 ? (
                  <circle
                    key={i}
                    cx={segment[0].x}
                    cy={segment[0].y}
                    r="3"
                    fill="#657a9e"
                  />
                ) : (
                  <path
                    key={i}
                    d={curve(segment)}
                    fill="none"
                    stroke="#657a9e"
                    strokeWidth="1.5"
                    strokeDasharray="4 5"
                  />
                ),
              )}
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
                    fill={color}
                    stroke="#fff"
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
          Lacunas indicam datas com dados indisponíveis.
        </p>
      )}
    </div>
  );
}
