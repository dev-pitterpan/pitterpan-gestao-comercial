import { requireSession } from "@shared/server/auth/session";
import { PageHeading } from "@shared/components/admin/Primitives";
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
    !report && (params.secao === "atribuicao" || params.secao === "clientes")
      ? params.secao
      : undefined;
  const attribution = hub === "atribuicao";
  const reports = Boolean(report) || params.secao === "relatorios";
  return (
    <>
      <PageHeading
        eyebrow="DADOS REAIS DA SHOPIFY"
        title={
          report?.title ??
          (attribution
            ? "Atribuição de marketing"
            : hub === "clientes"
              ? "Análise de clientes"
              : reports
                ? "Relatórios da Shopify"
                : "Visão geral da loja")
        }
        description={
          attribution
            ? "Compare as vendas e os pedidos atribuídos a canais e campanhas no mesmo período."
            : hub === "clientes"
              ? "Acompanhe novos compradores e clientes recorrentes no período."
              : reports
                ? "Explore vendas, clientes, tráfego e estoque por relatório."
                : "Acompanhe pagamentos, reembolsos e a evolução das vendas no período."
        }
      />
      <AnalyticsDashboard
        hub={hub}
        reports={reports}
        reportId={report?.id ?? ""}
      />
    </>
  );
}
