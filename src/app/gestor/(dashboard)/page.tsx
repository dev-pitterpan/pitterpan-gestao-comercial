import { allowed } from "@shared/server/auth/crypto";
import CommercialOverview from "@shared/components/admin/CommercialOverview";
import "./commercial-overview.css";
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
  dateTime,
  number,
  statusLabels,
} from "@shared/components/admin/Primitives";
export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string | string[] }>;
}) {
  const period = (await searchParams).periodo;
  const days = period === "1" ? 1 : period === "30" ? 30 : 7;
  const [context, user] = await Promise.all([adminContext(), requireSession()]);
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
      <header className="admin-overview-heading">
        <div>
          <span className="admin-eyebrow">SEU NEGÓCIO, EM PERSPECTIVA</span>
          <h1>Visão geral</h1>
          <p>
            Olá, {user.name.split(" ")[0]}. Acompanhe as vendas, o catálogo e as
            prioridades da operação.
          </p>
        </div>
        <span className="admin-date">
          <Clock3 size={15} />
          {new Intl.DateTimeFormat("pt-BR", {
            day: "numeric",
            month: "long",
            timeZone: "America/Sao_Paulo",
          }).format(new Date())}
        </span>
      </header>
      <DataNotice context={context} />
      {allowed(user.role, ["admin", "gestor"]) && (
        <CommercialOverview days={days} lowStock={context.settings.low} />
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
              <h2>Produtos por categoria</h2>
            </div>
            <span className="admin-subtle">Variantes</span>
          </header>
          <PartyChart categories={context.categories} />
          <Link className="admin-text-link" href="/gestor/produtos/">
            Explorar todos os produtos <ArrowRight size={16} />
          </Link>
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
            <p>Comparação entre as duas últimas versões publicadas.</p>
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
              Conferir alterações <ArrowRight size={16} />
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
