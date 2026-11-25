"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { infographicPalette as chartPalette } from "../../lib/admin/infographic";
import { chartDomain, distribution } from "../../lib/admin/infographic";
import InfographicRadial from "./InfographicRadial";
export type RankingItem = {
  label: string;
  value: number | null;
  detail?: string;
  href?: string;
};
export default function InfographicRanking({
  items,
  label,
  format,
  initial = "comparison",
  participation = true,
}: {
  items: RankingItem[];
  label: string;
  format: (value: number | null) => string;
  initial?: "comparison" | "share";
  participation?: boolean;
}) {
  const [page, setPage] = useState(0),
    [mode, setMode] = useState(initial);
  const pages = Math.max(1, Math.ceil(items.length / 6)),
    safePage = Math.min(page, pages - 1),
    start = safePage * 6,
    rows = items.slice(start, start + 6);
  const { low, high } = chartDomain(items.map((r) => r.value)),
    position = (n: number) => ((n - low) / (high - low)) * 100,
    shares = distribution(items.map((r) => r.value));
  return (
    <div className="infographic-ranking" role="group" aria-label={label}>
      <div className="infographic-tools">
        <span className="infographic-kicker">{label}</span>
        {participation && (
          <div
            className="infographic-switch"
            role="group"
            aria-label="Leitura da distribuição"
          >
            <button
              type="button"
              aria-pressed={mode === "comparison"}
              onClick={() => setMode("comparison")}
            >
              Comparar
            </button>
            <button
              type="button"
              aria-pressed={mode === "share"}
              onClick={() => setMode("share")}
              disabled={!shares.valid}
            >
              Participação
            </button>
          </div>
        )}
      </div>
      {!items.length ? (
        <p className="infographic-empty">Nenhum resultado disponível.</p>
      ) : mode === "share" && shares.valid ? (
        <InfographicRadial
          items={rows}
          total={shares.total}
          label="Participação nos grupos retornados"
          format={format}
        />
      ) : (
        <ol className="infographic-lollipops" start={start + 1}>
          {rows.map((item, i) => (
            <li key={`${start + i}-${item.label}`}>
              <span className="infographic-rank-index">
                {String(start + i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="infographic-rank-title">
                  {item.href ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  <strong>{format(item.value)}</strong>
                </div>
                <div className="infographic-lollipop-track" aria-hidden="true">
                  <i
                    className="infographic-lollipop-zero"
                    style={{ left: `${position(0)}%` }}
                  />
                  {item.value !== null && (
                    <span
                      style={{
                        left: `${Math.min(position(0), position(item.value))}%`,
                        width: `${Math.abs(position(item.value) - position(0))}%`,
                        background:
                          item.value < 0
                            ? "#c4473d"
                            : chartPalette[(start + i) % chartPalette.length],
                      }}
                    >
                      <b style={{ [item.value < 0 ? "left" : "right"]: 0 }} />
                    </span>
                  )}
                </div>
                <small>
                  {item.detail ??
                    (item.value === null
                      ? "Sem dados"
                      : shares.shares[start + i] === null
                        ? "Valor informado"
                        : `${shares.shares[start + i]!.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% dos grupos retornados`)}
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}
      {items.length > 6 && (
        <div className="infographic-pagination">
          <span>
            {start + 1}–{Math.min(start + 6, items.length)} de {items.length}{" "}
            grupos
          </span>
          <div>
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              aria-label="Grupos anteriores"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={safePage + 1 >= pages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Próximos grupos"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      <p className="infographic-note">
        {participation
          ? "Percentuais usam somente os grupos retornados nesta consulta. Não representam todo o catálogo ou outras páginas da fonte."
          : "Comprimentos comparados na mesma escala; valores ausentes não são zero."}
      </p>
    </div>
  );
}
