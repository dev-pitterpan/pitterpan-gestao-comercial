import {
  dateRangeSchema,
  shiftDate,
  todayDate,
} from "@shared/lib/admin/date-range";
import { allowed } from "@shared/server/auth/crypto";
import CommercialOverview, {
  loadOverview,
} from "@shared/components/admin/CommercialOverview";
import "./commercial-overview.css";
import CommercialPeriod from "@shared/components/admin/CommercialPeriod";
import SalesActivity from "@shared/components/admin/SalesActivity";
import StockOverview from "@shared/components/admin/StockOverview";
import PartyChart from "@shared/components/admin/PartyChart";
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
import { adminContext } from "@shared/server/admin/repository";
import { requireSession } from "@shared/server/auth/session";
import {
  DataNotice,
  PageHeading,
  dateTime,
  number,
} from "@shared/components/admin/Primitives";
export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string | string[];
    start?: string | string[];
    end?: string | string[];
  }>;
}) {
  const { periodo: period, start, end } = await searchParams;
  const days = period === "1" ? 1 : period === "7" ? 7 : 30;
  const today = todayDate();
  const parsed = dateRangeSchema.safeParse({ start, end });
  const range =
    parsed.success &&
    parsed.data.start >= "2000-01-01" &&
    parsed.data.end <= today
      ? parsed.data
      : { start: shiftDate(today, 1 - days), end: today };
  const [context, user] = await Promise.all([adminContext(), requireSession()]);
  const canViewSales = allowed(user.role, ["admin", "gestor"]);
  const sales = canViewSales
    ? await loadOverview(range).catch(() => null)
    : null;
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
    <div className="workspace-overview">
      <PageHeading
        eyebrow="SEU CENTRO DE OPERAÇÃO"
        title="Visão geral"
        description={`Olá, ${user.name.split(" ")[0]}. Acompanhe vendas, catálogo e prioridades da operação.`}
        filters={canViewSales ? <CommercialPeriod range={range} /> : undefined}
      />
      <nav
        className="workspace-overview-tabs"
        aria-label="Seções da visão geral"
      >
        {canViewSales && <a href="#workspace-performance">Desempenho</a>}
        <a href="#workspace-catalog">Catálogo e estoque</a>
        {canViewSales && <a href="#overview-pending">Prioridades</a>}
        <span>Uma operação. Todas as perspectivas.</span>
      </nav>
      <DataNotice context={context} />
      {canViewSales && (
        <CommercialOverview
          range={range}
          data={sales}
          admin={user.role === "admin"}
        />
      )}
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

      <div
        className={`workspace-business-grid${canViewSales ? "" : " is-catalog-only"}`}
      >
        <section className="admin-panel workspace-mix-card">
          <header>
            <div>
              <span className="workspace-overline">COMPOSIÇÃO DO MIX</span>
              <h2>Produtos em perspectiva</h2>
            </div>
            <Package size={18} />
          </header>
          <PartyChart
            categories={context.categories}
            soldProducts={sales?.ranking.map((item) => ({
              id: item.id,
              name: item.title,
              count: Number(item.units),
              detail:
                item.stock === null
                  ? undefined
                  : `${item.stock <= 0 ? "Sem estoque" : item.stock <= context.settings.low ? "Estoque baixo" : "Estoque agregado"} · ${number(item.stock)} un.`,
            }))}
            soldHref={`/gestor/vendas/?${new URLSearchParams(range)}#sold-products`}
          />
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
        {canViewSales &&
          (sales ? (
            <SalesActivity sales={sales.sales} />
          ) : (
            <section className="admin-panel workspace-activity-card">
              <span className="workspace-overline">RITMO DA OPERAÇÃO</span>
              <h2>Calendário de vendas</h2>
              <p>Os pedidos por dia aparecem após a sincronização.</p>
              <Link
                className="workspace-card-link"
                href="/gestor/sincronizacoes/"
              >
                Conferir sincronização <ArrowUpRight size={14} />
              </Link>
            </section>
          ))}
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
    </div>
  );
}
