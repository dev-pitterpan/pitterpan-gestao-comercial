"use client";
import { PageHeading } from "./Primitives";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Copy,
  Check,
  Share2,
  ArrowUpRight,
  ExternalLink,
  Gift,
  PartyPopper,
  Cake,
  Candy,
  Palette,
  CalendarHeart,
  Tags,
  Drama,
  Package,
  Ribbon,
  Sparkles,
  Layers3,
  Ghost,
  TreePine,
  Egg,
  Flag,
  ToyBrick,
  Trophy,
  Clover,
  Croissant,
} from "lucide-react";

const categoryArt = [
  {
    match: /halloween|terror/,
    icon: Ghost,
    colors: ["#6245a2", "#f1eaff", "#e3955e"],
  },
  { match: /natal/, icon: TreePine, colors: ["#256b52", "#e7f6ee", "#e07880"] },
  { match: /pascoa/, icon: Egg, colors: ["#8d478f", "#f9ecfb", "#edbc67"] },
  { match: /junina/, icon: Flag, colors: ["#a24e2c", "#fff0dc", "#ec9567"] },
  {
    match: /criancas|brinqued/,
    icon: ToyBrick,
    colors: ["#305fb4", "#e8f1ff", "#de8cc6"],
  },
  {
    match: /copa|futebol/,
    icon: Trophy,
    colors: ["#387345", "#ecf6dc", "#e6b84b"],
  },
  { match: /patrick/, icon: Clover, colors: ["#287354", "#e7f5e6", "#c6a840"] },
  {
    match: /carnaval|fantasia|maquiagem/,
    icon: Drama,
    colors: ["#813fa1", "#f8eafb", "#eb9f6c"],
  },
  {
    match: /artesanato|papelaria/,
    icon: Palette,
    colors: ["#a24861", "#fcecf0", "#d7a65b"],
  },
  {
    match: /datas|ocasioes/,
    icon: CalendarHeart,
    colors: ["#974278", "#faeaf4", "#a28de3"],
  },
  {
    match: /ofertas|promoc/,
    icon: Tags,
    colors: ["#a64b30", "#fff1e3", "#e0ad4d"],
  },
  {
    match: /chocolate/,
    icon: Croissant,
    colors: ["#874e36", "#f9eee2", "#da9d73"],
  },
  {
    match: /confeitaria|bolo/,
    icon: Cake,
    colors: ["#93477a", "#fbeaf4", "#e6a475"],
  },
  {
    match: /gulo|doces/,
    icon: Candy,
    colors: ["#944587", "#f8eafb", "#e7a85e"],
  },
  { match: /embalag/, icon: Gift, colors: ["#32786d", "#e5f6f1", "#8fa8e2"] },
  {
    match: /adornos|decor/,
    icon: Ribbon,
    colors: ["#7953ae", "#f2eafa", "#e799bd"],
  },
  {
    match: /utilidad/,
    icon: Package,
    colors: ["#2a687e", "#e7f4f7", "#85bea5"],
  },
  {
    match: /festas|baloes/,
    icon: PartyPopper,
    colors: ["#305fa4", "#e9f2ff", "#e5a64e"],
  },
  { match: /todos/, icon: Layers3, colors: ["#3f5ea1", "#ecf1fc", "#a595e3"] },
];
const fallbackArt = {
  icon: Sparkles,
  colors: ["#4d579d", "#edf0fd", "#d6a45e"],
};

import type { CatalogSummary } from "../../types/catalog";
import { publicCatalogUrl } from "../../lib/routes";
export default function CatalogGrid({
  items,
  base,
}: {
  items: (CatalogSummary & { count: number | null })[];
  base: string;
}) {
  const [q, setQ] = useState(""),
    [copied, setCopied] = useState(""),
    [message, setMessage] = useState("");
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const visible = items.filter((c) => normalize(c.name).includes(normalize(q)));
  async function share(slug: string, name: string, mode: "copy" | "share") {
    const url = publicCatalogUrl(slug, base, {
      hostname: location.hostname,
      origin: location.origin,
    });
    setMessage("");
    try {
      if (mode === "share" && navigator.share)
        await navigator.share({
          title: `Catálogo ${name} · Pitter Pan Festas`,
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(slug);
        setMessage(
          "Link público copiado. Seu cliente não precisa entrar na conta.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage(
        "Não foi possível copiar automaticamente. Abra a visualização e copie o endereço.",
      );
    }
  }
  return (
    <>
      <PageHeading
        title="Catálogos"
        description="Abra uma coleção ou compartilhe o link com seu cliente."
        filters={
          <div className="admin-catalog-toolbar">
            <label className="admin-filter-search">
              <Search size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Encontre um catálogo…"
                aria-label="Buscar catálogo"
              />
            </label>
            <span>{visible.length} seleções disponíveis</span>
          </div>
        }
      />
      <p className="admin-copy-status" role="status">
        {message}
      </p>
      <div className="catalog-library-grid">
        {visible.map((catalog) => {
          const { icon: Icon, colors } =
            categoryArt.find(({ match }) =>
              match.test(normalize(catalog.slug + " " + catalog.name)),
            ) ?? fallbackArt;
          const [accent, background, confetti] = colors;
          return (
            <article
              key={catalog.slug}
              className="catalog-library-card"
              style={
                {
                  "--collection-accent": accent,
                  "--collection-background": background,
                  "--collection-confetti": confetti,
                } as React.CSSProperties
              }
            >
              <div className="catalog-library-art" aria-hidden="true">
                <svg
                  className="catalog-library-confetti"
                  viewBox="0 0 240 92"
                  preserveAspectRatio="xMidYMid slice"
                  fill="none"
                >
                  <path d="M10 66c34-35 45 28 79 6M154 19c28 20 43-25 74-4M171 75c24-22 41-17 69-20" />
                  <path d="M34 24l5 10m25-15 8 4m116 19 4 9m27-18 8-6M78 59l7-8" />
                  <circle cx="21" cy="45" r="3" />
                  <circle cx="164" cy="44" r="3" />
                  <circle cx="211" cy="72" r="3" />
                </svg>
                <span className="catalog-library-symbol">
                  <Icon size={30} strokeWidth={1.65} />
                </span>
                {catalog.count !== null && (
                  <span className="catalog-library-count">
                    {catalog.count.toLocaleString("pt-BR")} variantes
                  </span>
                )}
              </div>
              <div className="catalog-library-content">
                <h2>{catalog.name}</h2>
                {catalog.count !== null && (
                  <span className="admin-sr-only">
                    {catalog.count} variantes
                  </span>
                )}
                <div className="catalog-library-actions">
                  <Link
                    href={`/gestor/${catalog.slug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={false}
                    className="catalog-library-open"
                  >
                    Abrir catálogo <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => share(catalog.slug, catalog.name, "copy")}
                    title="Copiar link público"
                    aria-label={`Copiar link de ${catalog.name}`}
                  >
                    {copied === catalog.slug ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => share(catalog.slug, catalog.name, "share")}
                    title="Compartilhar"
                    aria-label={`Compartilhar ${catalog.name}`}
                  >
                    <Share2 size={16} />
                  </button>
                  <a
                    href={`${publicCatalogUrl(catalog.slug, base)}?view=client`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver como cliente"
                    aria-label={`Ver ${catalog.name} como cliente`}
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="admin-empty">
          <h3>Nenhum catálogo encontrado</h3>
          <p>Tente outra palavra.</p>
        </div>
      )}
    </>
  );
}
