"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import AdminSelect from "./AdminSelect";
import { Pause, Play, RotateCcw, Sparkles } from "lucide-react";

type Category = { id?: string; name: string; count: number; detail?: string };
const colors = [
  "#354ba7",
  "#efbd37",
  "#e65b69",
  "#608aca",
  "#9b79ca",
  "#48a695",
];
const number = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

/** A small vector balloon, shared by the chart and section illustrations. */
export function PartyHelper() {
  return (
    <svg
      className="party-helper party-balloon"
      viewBox="0 0 80 112"
      fill="none"
      aria-hidden="true"
    >
      <g className="party-balloon-body">
        <path
          d="M40 76C26 69 13 48 15 30C17 2 62 1 65 30C68 48 54 69 40 76Z"
          fill="currentColor"
        />
        <path
          d="M25 30C25 21 30 16 36 15"
          stroke="white"
          strokeOpacity=".65"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M40 75L35 82H45Z" fill="currentColor" />
        <path
          d="M40 82C27 95 53 98 39 111"
          stroke="currentColor"
          strokeOpacity=".65"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default function PartyChart({
  categories,
  soldProducts,
  soldHref,
}: {
  categories: Category[];
  soldProducts?: Category[];
  soldHref?: string;
}) {
  const [products, setProducts] = useState(false);
  const showSold = products && soldProducts !== undefined;
  const dataset = showSold ? soldProducts : categories;
  const [sort, setSort] = useState("largest");
  const [paused, setPaused] = useState(false);
  const [scene, setScene] = useState(0);
  const [running, setRunning] = useState(true);
  const signature = JSON.stringify(dataset);
  const previous = useRef(signature);
  // Only animate on arrival, explicit replay, sorting or actual data changes.
  useEffect(() => {
    if (previous.current !== signature) {
      previous.current = signature;
      setScene((n) => n + 1);
      setRunning(true);
    }
  }, [signature]);
  useEffect(() => {
    if (!running || paused) return;
    const timer = window.setTimeout(() => setRunning(false), 2800);
    return () => window.clearTimeout(timer);
  }, [scene, running, paused]);
  const rows = [...dataset].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name, "pt-BR") : b.count - a.count,
  );
  const max = Math.max(1, ...rows.map((c) => c.count));
  const replay = () => {
    setScene((n) => n + 1);
    setRunning(true);
  };
  return (
    <div
      className={`party-chart${paused ? " is-paused" : ""}${running ? " is-running" : ""}`}
    >
      {soldProducts && (
        <div
          className="commercial-overview-controls"
          role="group"
          aria-label="Visão de produtos"
        >
          <button
            type="button"
            className="admin-button"
            aria-pressed={!showSold}
            onClick={() => setProducts(false)}
          >
            Por categoria
          </button>
          <button
            type="button"
            className="admin-button"
            aria-pressed={showSold}
            onClick={() => setProducts(true)}
          >
            Mais vendidos
          </button>
        </div>
      )}
      <div className="party-chart-toolbar">
        <label>
          Organizar por{" "}
          <AdminSelect
            value={sort}
            label={
              showSold ? "Organizar produtos vendidos" : "Organizar categorias"
            }
            onValueChange={(value) => {
              setSort(value);
              replay();
            }}
            options={[
              { value: "largest", label: "Maior quantidade" },
              {
                value: "name",
                label: showSold ? "Nome do produto" : "Nome da categoria",
              },
            ]}
          />
        </label>
        <div>
          <button
            type="button"
            onClick={replay}
            aria-label="Repetir animação do gráfico"
            title="Repetir animação"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
            aria-label={
              paused
                ? "Retomar animações do gráfico"
                : "Pausar animações do gráfico"
            }
            title={paused ? "Retomar" : "Pausar"}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
      </div>
      {rows.length ? (
        <div
          key={scene}
          className="party-chart-rows"
          role="list"
          aria-label={
            showSold
              ? "Unidades vendidas por produto"
              : "Quantidade de variantes por categoria"
          }
        >
          {rows.map((c, i) => (
            <div
              className="party-chart-row"
              role="listitem"
              key={c.id ?? c.name}
              style={
                {
                  "--bar-size": `${(c.count / max) * 100}%`,
                  "--bar-color": colors[i % colors.length],
                  "--bar-delay": `${Math.min(i, 5) * 70}ms`,
                } as CSSProperties
              }
            >
              <div className="party-chart-label">
                {showSold ? (
                  <span>{c.name}</span>
                ) : (
                  <Link
                    href={`/gestor/produtos/?${new URLSearchParams({ category: c.name })}`}
                    className="admin-text-link"
                  >
                    {c.name}
                  </Link>
                )}
                <strong>{number(c.count)}</strong>
              </div>
              {c.detail && <small className="admin-subtle">{c.detail}</small>}
              <div className="party-chart-mechanism">
                <div className="party-chart-track">
                  <div className="party-chart-bar" />
                  <span className="party-chart-cord" aria-hidden="true" />
                </div>
                {c.count > 0 && (
                  <div className="party-chart-reel">
                    <PartyHelper />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="party-chart-empty">
          <PartyHelper />
          <strong>
            {showSold
              ? "Sem produtos vendidos no período"
              : "Preparando o palco para seus produtos"}
          </strong>
          <p>
            {showSold
              ? "Escolha outro período no calendário."
              : "As categorias aparecem após a primeira importação publicada."}
          </p>
        </div>
      )}
      {!showSold && (
        <p className="party-chart-caption">
          <Sparkles size={14} />
          Selecione uma das seis maiores categorias para abrir seus produtos.
        </p>
      )}
      {showSold && soldHref ? (
        <Link className="admin-text-link" href={soldHref}>
          Ver produtos vendidos
        </Link>
      ) : (
        <Link className="admin-text-link" href="/gestor/produtos/">
          Explorar todos os produtos
        </Link>
      )}
    </div>
  );
}
