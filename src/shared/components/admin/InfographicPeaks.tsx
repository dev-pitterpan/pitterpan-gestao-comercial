"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { chartDomain, infographicPalette } from "../../lib/admin/infographic";
import { peakPolygon } from "../../lib/admin/reference-geometry";
export default function InfographicPeaks({
  items,
  format,
  offset = 0,
  domain,
}: {
  items: { label: string; value: number | null }[];
  format: (value: number | null) => string;
  offset?: number;
  domain?: { low: number; high: number };
}) {
  const [active, setActive] = useState<number | null>(null),
    [width, setWidth] = useState(500),
    host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = host.current;
    if (!node) return;
    const measure = () => setWidth(Math.max(240, node.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const { low, high } = domain ?? chartDomain(items.map((item) => item.value)),
    left = 42,
    right = width - 12,
    top = 30,
    bottom = 190,
    step = (right - left) / Math.max(1, items.length),
    x = (i: number) => left + (i + 0.5) * step,
    y = (value: number) =>
      bottom - ((value - low) / (high - low)) * (bottom - top);
  const row = active === null ? null : items[active];
  return (
    <div className="reference-peaks" ref={host}>
      <div className="reference-peaks-readout" aria-live="polite">
        <span>{row?.label ?? "COMPARAÇÃO NA MESMA ESCALA"}</span>
        <strong>{row ? format(row.value) : "Selecione um pico"}</strong>
      </div>
      <svg
        viewBox={`0 0 ${width} 222`}
        role="group"
        aria-label="Comparação em picos triangulares. Use as setas para explorar."
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Escape") setActive(null);
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            const delta = event.key === "ArrowRight" ? 1 : -1;
            setActive((i) =>
              Math.max(
                0,
                Math.min(
                  items.length - 1,
                  (i ?? (delta > 0 ? -1 : items.length)) + delta,
                ),
              ),
            );
          }
        }}
      >
        {[low, high].map((value, i) => (
          <g key={i}>
            <line
              x1={left}
              x2={right}
              y1={y(value)}
              y2={y(value)}
              stroke="#505761"
              strokeDasharray="1 5"
            />
            <text x={left - 6} y={y(value) + 4} textAnchor="end">
              {new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(value)}
            </text>
          </g>
        ))}
        <line x1={left} x2={right} y1={y(0)} y2={y(0)} stroke="#76828e" />
        {items.map((item, index) => {
          const shape =
            item.value === null
              ? ""
              : peakPolygon(x(index), y(0), y(item.value), step * 0.72);
          return (
            <g key={`${offset + index}-${item.label}`}>
              {shape ? (
                <polygon
                  points={shape}
                  fill={
                    item.value! < 0
                      ? "#c4473d"
                      : infographicPalette[
                          (offset + index) % infographicPalette.length
                        ]
                  }
                  opacity={active === null || active === index ? 1 : 0.3}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.label}: ${format(item.value)}`}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActive(index);
                    }
                  }}
                />
              ) : (
                <circle cx={x(index)} cy={y(0)} r="2" fill="#76828e" />
              )}
              <text x={x(index)} y="213" textAnchor="middle">
                {String(offset + index + 1).padStart(2, "0")}
              </text>
              {active === index && item.value !== null && (
                <g aria-hidden="true">
                  <line
                    x1={x(index)}
                    x2={x(index)}
                    y1={y(item.value)}
                    y2={Math.max(12, y(item.value) - 15)}
                    stroke="#e9edf0"
                  />
                  <circle
                    cx={x(index)}
                    cy={y(item.value)}
                    r="3"
                    fill="#e9edf0"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <p className="infographic-note">
        Altura e área dos triângulos seguem o valor. A numeração corresponde à
        legenda abaixo.
      </p>
    </div>
  );
}
