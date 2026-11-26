"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { infographicPalette as chartPalette } from "../../lib/admin/infographic";
import { distribution, chartDomain } from "../../lib/admin/infographic";
import InfographicRadial from "./InfographicRadial";
import InfographicBars from "./InfographicBars";
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
  initial = "share",
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
  const shares = distribution(items.map((r) => r.value));
  const isShare = participation && mode === "share" && shares.valid;
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
              aria-pressed={!isShare}
              onClick={() => setMode("comparison")}
            >
              Colunas
            </button>
            <button
              type="button"
              aria-pressed={isShare}
              onClick={() => setMode("share")}
              disabled={!shares.valid}
            >
              Leque
            </button>
          </div>
        )}
      </div>
      {!items.length ? (
        <p className="infographic-empty">Nenhum resultado disponível.</p>
      ) : isShare ? (
        <InfographicRadial
          items={rows.map((item, index) => ({
            ...item,
            color: chartPalette[(start + index) % chartPalette.length],
          }))}
          variant="fan"
          extent={Math.max(0, ...items.map((item) => item.value ?? 0))}
          total={shares.total}
          label="Participação nos grupos retornados"
          format={format}
        />
      ) : (
        <div>
          <InfographicBars
            key={start}
            items={rows}
            format={format}
            offset={start}
            domain={chartDomain(items.map((item) => item.value))}
          />
          <ol className="reference-bar-legend" start={start + 1}>
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
        </div>
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
          ? isShare
            ? "A área de cada setor representa o valor. Percentuais usam todos os grupos retornados, não o catálogo inteiro nem outras páginas da fonte."
            : "Picos comparados na mesma escala entre páginas. Percentuais usam todos os grupos retornados nesta consulta."
          : "Comprimentos comparados na mesma escala; valores ausentes não são zero."}
      </p>
    </div>
  );
}
