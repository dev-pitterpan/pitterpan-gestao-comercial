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
    color: "#023661",
  },
  { match: /natal/, icon: TreePine, color: "#023661" },
  { match: /pascoa/, icon: Egg, color: "#023661" },
  { match: /junina/, icon: Flag, color: "#c4473d" },
  {
    match: /criancas|brinqued/,
    icon: ToyBrick,
    color: "#305fb4",
  },
  {
    match: /copa|futebol/,
    icon: Trophy,
    color: "#023661",
  },
  { match: /patrick/, icon: Clover, color: "#023661" },
  {
    match: /carnaval|fantasia|maquiagem/,
    icon: Drama,
    color: "#023661",
  },
  {
    match: /artesanato|papelaria/,
    icon: Palette,
    color: "#c4473d",
  },
  {
    match: /datas|ocasioes/,
    icon: CalendarHeart,
    color: "#c4473d",
  },
  {
    match: /ofertas|promoc/,
    icon: Tags,
    color: "#c4473d",
  },
  {
    match: /chocolate/,
    icon: Croissant,
    color: "#c4473d",
  },
  {
    match: /confeitaria|bolo/,
    icon: Cake,
    color: "#023661",
  },
  {
    match: /gulo|doces/,
    icon: Candy,
    color: "#023661",
  },
  { match: /embalag/, icon: Gift, color: "#023661" },
  {
    match: /adornos|decor/,
    icon: Ribbon,
    color: "#023661",
  },
  {
    match: /utilidad/,
    icon: Package,
    color: "#2a687e",
  },
  {
    match: /festas|baloes/,
    icon: PartyPopper,
    color: "#305fa4",
  },
  { match: /todos/, icon: Layers3, color: "#023661" },
];
const fallbackArt = {
  icon: Sparkles,
  color: "#023661",
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
          const { icon: Icon, color } =
            categoryArt.find(({ match }) =>
              match.test(normalize(catalog.slug + " " + catalog.name)),
            ) ?? fallbackArt;
          return (
            <article key={catalog.slug} className="catalog-library-card">
              <div className="catalog-library-heading">
                <span className="catalog-library-symbol" aria-hidden="true">
                  <Icon size={27} strokeWidth={1.7} style={{ color }} />
                </span>
                <div>
                  <h2>{catalog.name}</h2>
                  {catalog.count !== null && (
                    <span className="catalog-library-count">
                      {catalog.count.toLocaleString("pt-BR")}{" "}
                      {catalog.count === 1 ? "variante" : "variantes"}
                    </span>
                  )}
                </div>
              </div>
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
