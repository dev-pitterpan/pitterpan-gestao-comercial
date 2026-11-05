import { requireSession } from "@shared/server/auth/session";
import styles from "./analysis.module.css";
import AnalyticsDashboard from "@shared/components/admin/AnalyticsDashboard";
import { reportById } from "@shared/lib/admin/shopify-reports";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ secao?: string; relatorio?: string }>;
}) {
  await requireSession(["admin", "gestor"]);
  const params = await searchParams;
  const report = reportById(params.relatorio ?? "");
  const hub =
    !report &&
    (params.secao === "atribuicao" ||
      params.secao === "clientes" ||
      params.secao === "vendas")
      ? params.secao
      : undefined;
  const sales = hub === "vendas";
  const attribution = hub === "atribuicao";
  const reports = Boolean(report) || params.secao === "relatorios";
  const title =
    report?.title ??
    (sales
      ? "Análise de vendas"
      : attribution
        ? "Atribuição de marketing"
        : hub === "clientes"
          ? "Análise de clientes"
          : reports
            ? "Relatórios da Shopify"
            : "Visão geral da loja");
  const description =
    report?.description ??
    (sales
      ? "Compare os recebimentos e os resultados comerciais da loja."
      : attribution
        ? "Compare as vendas e os pedidos atribuídos a canais e campanhas no mesmo período."
        : hub === "clientes"
          ? "Acompanhe novos compradores e clientes recorrentes no período."
          : reports
            ? "Explore vendas, clientes, tráfego e estoque por relatório."
            : "Acompanhe pagamentos, reembolsos e a evolução das vendas no período.");
  const category =
    report?.category ??
    (sales
      ? "sales"
      : attribution
        ? "marketing"
        : hub === "clientes"
          ? "customers"
          : reports
            ? "reports"
            : "overview");
  return (
    <>
      <header className={styles.banner} data-category={category}>
        <span>ANÁLISES / SHOPIFY</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <AnalyticsDashboard
        hub={hub}
        reports={reports}
        reportId={report?.id ?? ""}
      />
    </>
  );
}
