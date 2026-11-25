"use client";
import { useState } from "react";
import Link from "next/link";
import AdminSelect from "./AdminSelect";
import InfographicRanking from "./InfographicRanking";
type Category = { id?: string; name: string; count: number; detail?: string };
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
  const [products, setProducts] = useState(false),
    [sort, setSort] = useState("largest");
  const showSold = products && soldProducts !== undefined;
  const rows = [...(showSold ? soldProducts : categories)].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name, "pt-BR") : b.count - a.count,
  );
  return (
    <div className="infographic-catalog">
      <div className="infographic-catalog-toolbar">
        {soldProducts && (
          <div
            className="infographic-switch"
            role="group"
            aria-label="Visão de produtos"
          >
            <button
              type="button"
              aria-pressed={!showSold}
              onClick={() => setProducts(false)}
            >
              Categorias
            </button>
            <button
              type="button"
              aria-pressed={showSold}
              onClick={() => setProducts(true)}
            >
              Mais vendidos
            </button>
          </div>
        )}
        <AdminSelect
          value={sort}
          label="Organizar categorias e produtos"
          onValueChange={setSort}
          options={[
            { value: "largest", label: "Maior quantidade" },
            { value: "name", label: "Nome" },
          ]}
        />
      </div>
      <InfographicRanking
        key={`${showSold}-${sort}`}
        label={
          showSold
            ? "Unidades vendidas por produto"
            : "Variantes nas categorias exibidas"
        }
        items={rows.map((row) => ({
          label: row.name,
          value: row.count,
          detail: row.detail,
          href: showSold
            ? undefined
            : `/gestor/produtos/?${new URLSearchParams({ category: row.name })}`,
        }))}
        format={(value) =>
          value === null ? "—" : value.toLocaleString("pt-BR")
        }
      />
      <Link
        className="admin-text-link"
        href={showSold && soldHref ? soldHref : "/gestor/produtos/"}
      >
        {showSold ? "Ver produtos vendidos" : "Explorar todos os produtos"} →
      </Link>
    </div>
  );
}
