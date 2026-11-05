import { requireSession } from "@shared/server/auth/session";
import { PageHeading } from "@shared/components/admin/Primitives";
import AnalyticsDashboard from "@shared/components/admin/AnalyticsDashboard";
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ secao?: string }>;
}) {
  await requireSession(["admin", "gestor"]);
  const reports = (await searchParams).secao === "relatorios";
  return (
    <>
      <PageHeading
        eyebrow="DADOS REAIS DA SHOPIFY"
        title={reports ? "Relatórios da Shopify" : "Visão geral da loja"}
        description={
          reports
            ? "Explore vendas, clientes, tráfego e estoque por relatório."
            : "Acompanhe pagamentos, reembolsos e a evolução das vendas no período."
        }
      />
      <AnalyticsDashboard reports={reports} />
    </>
  );
}
