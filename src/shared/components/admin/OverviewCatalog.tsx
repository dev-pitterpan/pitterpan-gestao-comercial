import Link from "next/link";
import {
  Package,
  BadgePercent,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  CircleCheck,
  Clock3,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import type { AdminContext } from "../../server/admin/repository";
import { number, dateTime } from "./Primitives";
import StockOverview from "./StockOverview";
import PartyChart from "./PartyChart";
export default function OverviewCatalog({
  context,
}: {
  context: AdminContext;
}) {
  const s = context.summary;
  const last = context.runs.find((r) => r.id === context.active);
  const stats = [
    {
      label: "Produtos no catálogo",
      value: s?.products,
      detail: s
        ? `${number(s.variants)} variantes cadastradas`
        : "Aguardando os dados da sua loja",
      icon: Package,
      tone: "blue",
      href: "/gestor/produtos/",
    },
    {
      label: "Variantes em oferta",
      value: s?.offers,
      detail: "Preço menor que o preço anterior",
      icon: BadgePercent,
      tone: "teal",
      href: "/gestor/ofertas/",
    },
    {
      label: "Estoque baixo",
      value: s?.low,
      detail: `De 1 a ${context.settings.low} unidades por variante`,
      icon: Boxes,
      tone: "amber",
      href: "/gestor/estoque/?stock=low",
    },
    {
      label: "Sem estoque",
      value: s?.out,
      detail: "Variantes com quantidade igual ou menor que zero",
      icon: Boxes,
      tone: "rose",
      href: "/gestor/estoque/?stock=out",
    },
  ];
  return (
    <>
      <div className="workspace-section-heading" id="workspace-catalog">
        <div>
          <span className="workspace-overline">CATÁLOGO & DISPONIBILIDADE</span>
          <h2>O mix que movimenta sua loja</h2>
        </div>
        <Link href="/gestor/produtos/">
          Ver produtos <ArrowUpRight size={15} />
        </Link>
      </div>
      <section
        className="workspace-catalog-metrics"
        aria-label="Indicadores do catálogo"
      >
        {stats.map(({ label, value, detail, icon: Icon, tone, href }) => (
          <Link
            href={href}
            key={label}
            className={`workspace-catalog-metric workspace-catalog-metric--${tone}${value == null ? " is-unavailable" : ""}`}
          >
            <div>
              <span className={`admin-stat-icon ${tone}`}>
                <Icon size={21} />
              </span>
              <ArrowUpRight size={17} />
            </div>
            <span>{label}</span>
            <strong>{number(value)}</strong>
            <small>
              {value == null ? "Disponível após a importação" : detail}
            </small>
          </Link>
        ))}
      </section>

      <div className="workspace-business-grid is-catalog-only">
        <section className="admin-panel workspace-mix-card">
          <header>
            <div>
              <span className="workspace-overline">COMPOSIÇÃO DO MIX</span>
              <h2>Produtos em perspectiva</h2>
            </div>
            <Package size={18} />
          </header>
          <PartyChart categories={context.categories} />
        </section>
        <section className="admin-panel workspace-stock-card">
          <header>
            <div>
              <span className="workspace-overline">DISPONIBILIDADE</span>
              <h2>Saúde do estoque</h2>
            </div>
            <Boxes size={18} />
          </header>
          <StockOverview summary={s} low={context.settings.low} />
        </section>
      </div>
      <section className="workspace-changes-strip">
        <div>
          <span className="workspace-overline">MOVIMENTAÇÕES DO CATÁLOGO</span>
          <h2>O que mudou na loja?</h2>
          <p>
            {context.previous
              ? "Comparação entre as duas últimas publicações."
              : "Comparativo disponível a partir da segunda publicação."}
          </p>
        </div>
        <div className="workspace-change-count">
          <span className="is-green">
            <ArrowUpRight size={14} /> Entraram
          </span>
          <strong>{number(context.changes?.added)}</strong>
        </div>
        <div className="workspace-change-count">
          <span className="is-coral">
            <ArrowDownRight size={14} /> Saíram
          </span>
          <strong>{number(context.changes?.removed)}</strong>
        </div>
        <div className="workspace-change-count">
          <span>
            <RefreshCw size={13} /> Mudaram
          </span>
          <strong>{number(context.changes?.changed)}</strong>
        </div>
        <Link href="/gestor/alteracoes/" className="workspace-card-link">
          Ver histórico <ArrowRight size={14} />
        </Link>
      </section>
      <section className="workspace-publish-note">
        <div>
          {last ? <CircleCheck size={17} /> : <Clock3 size={17} />}
          <span>
            {last
              ? `Catálogo publicado em ${dateTime(last.completed_at)} · ${number(last.report.variants)} variantes`
              : "Publique uma importação para acompanhar o catálogo completo."}
          </span>
        </div>
        <Link href="/gestor/sincronizacoes/">
          Sincronizações <ArrowUpRight size={14} />
        </Link>
        <Link href="/gestor/catalogos/">
          Compartilhar catálogo <BookOpen size={14} />
        </Link>
      </section>
    </>
  );
}
