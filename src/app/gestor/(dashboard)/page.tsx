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
import StockOverview from "@shared/components/admin/StockOverview";
import PartyChart from "@shared/components/admin/PartyChart";
import Link from "next/link";
import {
  Package,
  BadgePercent,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  CircleCheck,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { adminContext } from "@shared/server/admin/repository";
import { requireSession } from "@shared/server/auth/session";
import {
  DataNotice,
  PageHeading,
  dateTime,
  number,
  statusLabels,
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
  const days = period === "1" ? 1 : period === "30" ? 30 : 7;
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
      tone: "violet",
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
      <PageHeading
        title="Visão geral"
        description={`Olá, ${user.name.split(" ")[0]}. Acompanhe vendas, catálogo e prioridades da operação.`}
        filters={canViewSales ? <CommercialPeriod range={range} /> : undefined}
      />
      <DataNotice context={context} />
      {canViewSales && (
        <CommercialOverview
          range={range}
          data={sales}
          admin={user.role === "admin"}
        />
      )}
      <section className="admin-stats" aria-label="Indicadores do catálogo">
        {stats.map(({ label, value, detail, icon: Icon, tone, href }) => (
          <Link
            href={href}
            key={label}
            className={`admin-stat admin-stat--${tone}${value == null ? " is-unavailable" : ""}`}
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
      <div className="admin-overview-grid overview-insights-grid">
        <section className="admin-panel">
          <header>
            <div>
              <span className="admin-eyebrow">MIX DA LOJA</span>
              <h2>{sales ? "Produtos" : "Produtos por categoria"}</h2>
            </div>
            {!sales && <span className="admin-subtle">Variantes</span>}
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
        <div className="overview-insights-stack">
          <section className="admin-panel admin-changes-panel">
            <header>
              <div>
                <span className="admin-eyebrow">CATÁLOGO EM MOVIMENTO</span>
                <h2>O que mudou?</h2>
              </div>
              <RefreshCw size={19} />
            </header>
            <p>
              Mudanças nos produtos da Shopify detectadas entre as duas últimas
              sincronizações.
            </p>
            <div className="admin-change-metrics">
              <div>
                <span className="green">
                  <ArrowUpRight size={18} /> Entraram
                </span>
                <strong>{number(context.changes?.added)}</strong>
              </div>
              <div>
                <span className="rose">
                  <ArrowDownRight size={18} /> Saíram
                </span>
                <strong>{number(context.changes?.removed)}</strong>
              </div>
              <div>
                <span className="blue">
                  <RefreshCw size={17} /> Mudaram
                </span>
                <strong>{number(context.changes?.changed)}</strong>
              </div>
            </div>
            {!context.previous && (
              <p className="admin-inline-note">
                O histórico começa a comparar mudanças a partir da segunda
                publicação.
              </p>
            )}
            <Link className="admin-text-link" href="/gestor/alteracoes/">
              Ver alterações na Shopify <ArrowRight size={16} />
            </Link>
          </section>
          <section className="admin-panel overview-stock-panel">
            <header>
              <div>
                <span className="admin-eyebrow">RESUMO DO CATÁLOGO</span>
                <h2>Como está o estoque?</h2>
              </div>
              <Boxes size={19} />
            </header>
            <StockOverview summary={s} low={context.settings.low} />
          </section>
        </div>
      </div>
      <div className="admin-overview-bottom">
        <section className="admin-panel admin-sync-card">
          <div className={`admin-sync-icon${last ? "" : " is-pending"}`}>
            {last ? <CircleCheck size={25} /> : <Clock3 size={25} />}
          </div>
          <span className="admin-eyebrow">ÚLTIMA PUBLICAÇÃO</span>
          <h2>
            {last
              ? dateTime(last.completed_at)
              : "A próxima etapa da sua gestão"}
          </h2>
          <p>
            {last
              ? `${number(last.report.variants)} variantes · ${statusLabels[last.status] || last.status}`
              : "Publique uma importação para acompanhar sua loja com dados completos."}
          </p>
          <Link className="admin-text-link" href="/gestor/sincronizacoes/">
            Ver sincronizações <ArrowUpRight size={16} />
          </Link>
        </section>
        <Link className="admin-share-card" href="/gestor/catalogos/">
          <BookOpen size={26} />
          <span>UMA SELEÇÃO. UM LINK.</span>
          <h2>
            O catálogo certo,
            <br />
            para cada cliente.
          </h2>
          <span>
            Escolher e compartilhar <ArrowUpRight size={16} />
          </span>
        </Link>
      </div>
    </>
  );
}
