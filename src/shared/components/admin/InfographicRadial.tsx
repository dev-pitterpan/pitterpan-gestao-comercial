"use client";
import { useState } from "react";
import Link from "next/link";
import { ChartPie } from "lucide-react";
import {
  infographicPalette,
  distribution,
  chartNumber,
} from "../../lib/admin/infographic";
import {
  annularSector,
  fanRadius,
  polar,
} from "../../lib/admin/reference-geometry";
export type RadialItem = {
  label: string;
  value: number | null;
  color?: string;
  detail?: string;
  href?: string;
};
export default function InfographicRadial({
  items,
  total,
  label,
  format,
  onSelect,
  selected,
  proportions = true,
  variant = "rings",
  extent,
}: {
  items: RadialItem[];
  total?: number;
  label: string;
  format: (value: number | null) => string;
  onSelect?: (index: number | null) => void;
  selected?: number | null;
  proportions?: boolean;
  variant?: "rings" | "fan" | "segments";
  extent?: number;
}) {
  const [internal, setInternal] = useState<number | null>(null),
    requested = selected === undefined ? internal : selected;
  const active =
    requested !== null && requested >= 0 && requested < items.length
      ? requested
      : null;
  const select = (index: number | null) => {
    setInternal(index);
    onSelect?.(index);
  };
  const computed = distribution(
      items.map((item) => chartNumber(item.value)),
      total,
    ),
    valid = proportions && computed.valid;
  const visible = items.slice(0, 9),
    largest = visible.reduce(
      (best, item, index) =>
        (item.value ?? -Infinity) > (visible[best]?.value ?? -Infinity)
          ? index
          : best,
      0,
    ),
    focus = active ?? (visible.length ? largest : null);
  const current = focus === null ? undefined : items[focus],
    percent = valid && focus !== null ? computed.shares[focus] : null;
  const color = (index: number) =>
    items[index].color ?? infographicPalette[index % infographicPalette.length];
  const max =
    extent ?? Math.max(0, ...items.map((item) => chartNumber(item.value) ?? 0));
  const bandStep = Math.min(21, 65 / Math.max(1, visible.length - 1)),
    bandWidth = Math.min(16, bandStep - 3);
  let cumulative = 0;
  const sectors = visible.map((item, index) => {
    const share = valid ? computed.shares[index]! : 0;
    const start = -90 + cumulative * 3.6;
    cumulative += share;
    return { item, index, share, start, end: start + share * 3.6 };
  });
  const keyboard = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(index);
    }
    if (event.key === "Escape") select(null);
  };
  return (
    <div
      className={`infographic-radial reference-radial reference-radial--${variant}`}
      role="group"
      aria-label={label}
    >
      <div className="reference-radial-figure">
        <svg
          viewBox="0 0 320 300"
          role="group"
          aria-label={`${label} em ${variant === "fan" ? "leque radial" : variant === "segments" ? "círculo segmentado" : "arcos sobrepostos"}`}
        >
          <circle
            cx="160"
            cy="144"
            r="130"
            fill="none"
            stroke="#59606a"
            strokeOpacity=".25"
            strokeDasharray="1 6"
          />
          {variant === "rings" ? (
            visible.map((item, index) => {
              const radius = 121 - index * bandStep,
                share = valid ? computed.shares[index] : null;
              return (
                <g key={`${item.label}-${index}`}>
                  <circle
                    cx="160"
                    cy="144"
                    r={radius}
                    fill="none"
                    stroke="#34383f"
                    strokeWidth={bandWidth}
                    pathLength="100"
                    strokeDasharray="75 25"
                    transform="rotate(-90 160 144)"
                  />
                  {share !== null && share > 0 && (
                    <circle
                      cx="160"
                      cy="144"
                      r={radius}
                      fill="none"
                      stroke={color(index)}
                      strokeWidth={bandWidth}
                      pathLength="100"
                      strokeDasharray={`${share * 0.75} ${100 - share * 0.75}`}
                      transform="rotate(-90 160 144)"
                      opacity={active === null || active === index ? 1 : 0.3}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.label}: ${format(item.value)}, ${share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
                      onFocus={() => select(index)}
                      onClick={() => select(index)}
                      onKeyDown={(event) => keyboard(event, index)}
                    />
                  )}
                </g>
              );
            })
          ) : variant === "fan" ? (
            visible.map((item, index) => {
              const angle = 270 / Math.max(1, visible.length),
                start = -135 + index * angle,
                outer = valid ? fanRadius(item.value ?? 0, max) : 48;
              const path = annularSector(
                160,
                144,
                48,
                outer,
                start + 1,
                start + angle - 1,
              );
              return (
                <g key={`${item.label}-${index}`}>
                  <path
                    d={annularSector(
                      160,
                      144,
                      48,
                      123,
                      start + 1,
                      start + angle - 1,
                    )}
                    fill="#34383f"
                    fillOpacity=".55"
                  />
                  {path && (
                    <path
                      d={path}
                      fill={color(index)}
                      stroke="#0a0c12"
                      strokeWidth="1"
                      opacity={active === null || active === index ? 1 : 0.3}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.label}: ${format(item.value)}`}
                      onFocus={() => select(index)}
                      onClick={() => select(index)}
                      onKeyDown={(event) => keyboard(event, index)}
                    />
                  )}
                </g>
              );
            })
          ) : (
            <>
              <circle
                cx="160"
                cy="144"
                r="104"
                fill="none"
                stroke="#34383f"
                strokeWidth="40"
              />
              {sectors.map(({ item, index, share, start, end }) =>
                share > 0 ? (
                  <path
                    key={`${item.label}-${index}`}
                    d={annularSector(
                      160,
                      144,
                      84,
                      124,
                      start + Math.min(0.7, (end - start) / 4),
                      end - Math.min(0.7, (end - start) / 4),
                    )}
                    fill={color(index)}
                    opacity={active === null || active === index ? 1 : 0.3}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.label}: ${format(item.value)}`}
                    onFocus={() => select(index)}
                    onClick={() => select(index)}
                    onKeyDown={(event) => keyboard(event, index)}
                  />
                ) : null,
              )}
            </>
          )}
          <circle
            cx="160"
            cy="144"
            r={variant === "rings" ? 40 : 44}
            fill="#3f3a42"
            stroke="#76828e"
            strokeWidth="1"
          />
          <ChartPie
            x="149"
            y="119"
            width="22"
            height="22"
            color="#eef1f4"
            aria-hidden="true"
          />
          <text
            x="160"
            y="166"
            textAnchor="middle"
            className="reference-radial-score"
          >
            {percent === null
              ? "—"
              : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
          </text>
          {valid && focus !== null && focus < visible.length && (
            <g aria-hidden="true">
              {(() => {
                const share = computed.shares[focus]!;
                const angle =
                  variant === "rings"
                    ? -90 + share * 2.7
                    : variant === "fan"
                      ? -135 + ((focus + 0.5) * 270) / visible.length
                      : (sectors[focus].start + sectors[focus].end) / 2;
                const r =
                  variant === "rings"
                    ? 121 - focus * bandStep
                    : variant === "fan"
                      ? fanRadius(items[focus].value ?? 0, max)
                      : 124;
                const point = polar(160, 144, r, angle),
                  end = polar(160, 144, 144, angle),
                  boxX = Math.max(2, Math.min(270, end.x - 24)),
                  boxY = Math.max(2, Math.min(274, end.y - 10));
                return (
                  <>
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={color(focus)}
                      strokeWidth="1"
                    />
                    <rect
                      x={boxX}
                      y={boxY}
                      width="48"
                      height="20"
                      fill="#edf0f3"
                    />
                    <text
                      x={boxX + 24}
                      y={boxY + 14}
                      textAnchor="middle"
                      className="reference-callout"
                    >
                      {share.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </svg>
        <div className="reference-radial-caption" aria-live="polite">
          <span>{current?.label ?? label}</span>
          <strong>
            {current ? format(chartNumber(current.value)) : "Sem dados"}
          </strong>
        </div>
        {current?.href && (
          <Link className="reference-open" href={current.href}>
            Abrir detalhes
          </Link>
        )}
      </div>
      <div className="infographic-orbit-legend">
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            aria-pressed={active === index}
            onFocus={() => select(index)}
            onClick={() => select(index)}
          >
            <i style={{ background: color(index) }} />
            <span>
              {item.label}
              {item.detail && <small>{item.detail}</small>}
            </span>
            <strong>
              {format(chartNumber(item.value))}
              <small>
                {valid
                  ? `${computed.shares[index]!.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                  : "—"}
              </small>
            </strong>
          </button>
        ))}
      </div>
      <div className="reference-radial-base">
        <span>Base informada</span>
        <strong>{format(chartNumber(computed.total))}</strong>
        {active !== null && (
          <button type="button" onClick={() => select(null)}>
            Ver conjunto
          </button>
        )}
      </div>
      {!valid && (
        <p className="infographic-note">
          Participação indisponível: base zero, valores negativos ou dados
          incompletos. Os valores informados continuam na legenda.
        </p>
      )}
      {items.length > 9 && (
        <p className="infographic-note">
          Nove grupos no desenho; todos os grupos permanecem na legenda.
        </p>
      )}
    </div>
  );
}
