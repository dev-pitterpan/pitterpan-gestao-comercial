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
  const reports = Boolean(report) || params.secao === "relatorios";
  return (
    <>
      <PageHeading
        eyebrow="DADOS REAIS DA SHOPIFY"
        title={
          report?.title ??
          (reports ? "Relatórios da Shopify" : "Visão geral da loja")
        }
        description={
          reports
            ? "Explore vendas, clientes, tráfego e estoque por relatório."
            : "Acompanhe pagamentos, reembolsos e a evolução das vendas no período."
        }
      />
      <AnalyticsDashboard reports={reports} reportId={report?.id ?? ""} />
    </>
  );
}
