"use client";
import { useState } from "react";
import { infographicPalette as chartPalette } from "../../lib/admin/infographic";
import { distribution } from "../../lib/admin/infographic";
export type RadialItem = {
  label: string;
  value: number | null;
  color?: string;
  detail?: string;
};
export default function InfographicRadial({
  items,
  total,
  label,
  format,
  onSelect,
  selected,
  proportions = true,
}: {
  proportions?: boolean;
  items: RadialItem[];
  total?: number;
  label: string;
  format: (value: number | null) => string;
  onSelect?: (index: number | null) => void;
  selected?: number | null;
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
      items.map((r) => r.value),
      total,
    ),
    current = active === null ? null : items[active];
  const shares = proportions
    ? computed
    : { ...computed, valid: false, shares: items.map(() => null) };
  const visible = items.slice(0, 9),
    percent = active === null ? null : shares.shares[active];
  return (
    <div className="infographic-radial" role="group" aria-label={label}>
      <div className="infographic-orbits">
        <svg viewBox="0 0 300 270" aria-hidden="true">
          {visible.map((item, index) => {
            const radius =
                124 -
                index * Math.min(10, 49 / Math.max(1, visible.length - 1)),
              share = shares.shares[index];
            return (
              <g key={item.label} transform="rotate(135 150 145)">
                <circle
                  cx="150"
                  cy="145"
                  r={radius}
                  fill="none"
                  stroke="#30373f"
                  strokeWidth="6"
                  pathLength="100"
                  strokeDasharray="75 25"
                />
                {share !== null && share > 0 && (
                  <circle
                    cx="150"
                    cy="145"
                    r={radius}
                    fill="none"
                    stroke={
                      item.color ?? chartPalette[index % chartPalette.length]
                    }
                    strokeWidth={active === index ? 8 : 6}
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray={`${share * 0.75} ${100 - share * 0.75}`}
                    opacity={active === null || active === index ? 1 : 0.3}
                  />
                )}
              </g>
            );
          })}
          <text
            x="150"
            y="140"
            textAnchor="middle"
            className="infographic-orbit-number"
          >
            {percent === null
              ? format(shares.total)
              : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
          </text>
          <text x="150" y="161" textAnchor="middle">
            {current ? "da base informada" : "base informada"}
          </text>
        </svg>
        <span className="infographic-orbit-caption">
          {current?.label ?? label}
        </span>
      </div>
      <div className="infographic-orbit-legend">
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            aria-pressed={active === index}
            onClick={() => select(index)}
            onFocus={() => select(index)}
          >
            <i
              style={{
                background:
                  item.color ?? chartPalette[index % chartPalette.length],
              }}
            />
            <span>
              {item.label}
              {item.detail && <small>{item.detail}</small>}
            </span>
            <strong>
              {format(item.value)}
              <small>
                {shares.shares[index] === null
                  ? "—"
                  : `${shares.shares[index]!.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
              </small>
            </strong>
          </button>
        ))}
      </div>
      {active !== null && (
        <button
          type="button"
          className="infographic-reset"
          onClick={() => select(null)}
        >
          Ver base completa
        </button>
      )}
      {!shares.valid && (
        <p className="infographic-note">
          Participação indisponível: base zero, valores negativos ou dados
          incompletos. Confira os valores na legenda.
        </p>
      )}
      {items.length > 9 && (
        <p className="infographic-note">
          Os nove primeiros grupos são exibidos nos anéis. A legenda contém
          todos os grupos.
        </p>
      )}
    </div>
  );
}
