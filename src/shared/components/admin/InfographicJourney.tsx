"use client";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { AnalyticsTable } from "../../server/sales/analytics";
import { chartNumber, infographicPalette } from "../../lib/admin/infographic";
import { polar } from "../../lib/admin/reference-geometry";
export default function InfographicJourney({
  table,
}: {
  table: AnalyticsTable;
}) {
  const stages = [
    ["sessions", "Sessões"],
    ["sessions_with_cart_additions", "Adicionaram ao carrinho"],
    ["sessions_that_reached_checkout", "Chegaram ao checkout"],
    ["sessions_that_completed_checkout", "Concluíram a compra"],
  ];
  const values = stages.map(([key]) => chartNumber(table.rows[0]?.[key])),
    base = values[0];
  const [selected, setSelected] = useState(3);
  const shares = values.map((value) =>
    base !== null && base > 0 && value !== null && value >= 0 && value <= base
      ? (value / base) * 100
      : null,
  );
  const consistent = values.every(
    (value, index) =>
      value === null ||
      (value >= 0 &&
        (index === 0 ||
          values[index - 1] === null ||
          value <= values[index - 1]!)),
  );
  const pct = (value: number | null) =>
    value === null
      ? "—"
      : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  const format = (value: number | null) =>
    value === null ? "—" : value.toLocaleString("pt-BR");
  const point =
    shares[selected] === null
      ? null
      : polar(160, 144, 121 - selected * 21, -90 + shares[selected]! * 2.7);
  return (
    <div
      className="infographic-funnel reference-journey"
      role="group"
      aria-label="Funil de conversão das sessões"
    >
      <div className="infographic-tools">
        <span className="infographic-kicker">DA VISITA À COMPRA</span>
        <span>Base: sessões</span>
      </div>
      <div className="reference-journey-body">
        <div className="reference-radial-figure">
          <svg
            viewBox="0 0 320 300"
            role="group"
            aria-label="Etapas de compra em arcos sobrepostos"
          >
            {stages.map(([, label], index) => (
              <g key={label}>
                <circle
                  cx="160"
                  cy="144"
                  r={121 - index * 21}
                  fill="none"
                  stroke="#34383f"
                  strokeWidth="15"
                  pathLength="100"
                  strokeDasharray="75 25"
                  transform="rotate(-90 160 144)"
                />
                {shares[index] !== null && shares[index]! > 0 && (
                  <circle
                    cx="160"
                    cy="144"
                    r={121 - index * 21}
                    fill="none"
                    stroke={infographicPalette[index]}
                    strokeWidth="15"
                    pathLength="100"
                    strokeDasharray={`${shares[index]! * 0.75} ${100 - shares[index]! * 0.75}`}
                    transform="rotate(-90 160 144)"
                    opacity={selected === index ? 1 : 0.65}
                    role="button"
                    tabIndex={0}
                    aria-label={`${label}: ${format(values[index])}, ${pct(shares[index])}`}
                    onClick={() => setSelected(index)}
                    onFocus={() => setSelected(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(index);
                      }
                    }}
                  />
                )}
              </g>
            ))}
            <circle cx="160" cy="144" r="40" fill="#3f3a42" stroke="#76828e" />
            <ShoppingBag
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
              {pct(shares[selected])}
            </text>
            {point && (
              <g aria-hidden="true">
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={point.y}
                  y2={point.y - 15}
                  stroke="#eef1f4"
                />
                <rect
                  x={Math.max(2, Math.min(270, point.x - 24))}
                  y={Math.max(1, point.y - 35)}
                  width="48"
                  height="20"
                  fill="#edf0f3"
                />
                <text
                  x={Math.max(2, Math.min(270, point.x - 24)) + 24}
                  y={Math.max(1, point.y - 35) + 14}
                  textAnchor="middle"
                  className="reference-callout"
                >
                  {pct(shares[selected])}
                </text>
              </g>
            )}
          </svg>
          <div className="reference-radial-caption" aria-live="polite">
            <span>{stages[selected][1]}</span>
            <strong>{format(values[selected])}</strong>
          </div>
        </div>
        <div className="reference-journey-legend">
          {stages.map(([, label], index) => (
            <button
              type="button"
              key={label}
              aria-pressed={selected === index}
              onFocus={() => setSelected(index)}
              onClick={() => setSelected(index)}
            >
              <i style={{ background: infographicPalette[index] }} />
              <span>{label}</span>
              <strong>
                {format(values[index])}
                <small>{pct(shares[index])}</small>
              </strong>
            </button>
          ))}
        </div>
      </div>
      <p className="infographic-note">
        {base === null || base <= 0
          ? "Base de sessões indisponível ou zero. Confira os valores informados nas etapas."
          : consistent
            ? "Cada arco usa o total de sessões como base. As etapas se sobrepõem; não some seus percentuais."
            : "A fonte retornou etapas fora da sequência esperada. Os valores foram preservados; proporções sem base válida não são desenhadas."}
      </p>
    </div>
  );
}
