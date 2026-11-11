import { salesFilterSchema } from "../../server/sales/filters";
import { requireSession } from "../../server/auth/session";
import SalesDashboard from "./SalesDashboard";
import { PageHeading } from "./Primitives";

export const salesPages = {
  resumo: {
    view: "summary",
    title: "Resumo Shopify",
    description:
      "Acompanhe os indicadores e abra os detalhes de cada resultado.",
  },
  pedidos: {
    view: "orders",
    title: "Pedidos Shopify",
    description: "Consulte pedidos, itens, pagamentos e entregas.",
  },
  recebimentos: {
    view: "receipts",
    title: "Recebimentos",
    description: "Veja o recebido e o líquido dos pedidos selecionados.",
  },
  reembolsos: {
    view: "refunds",
    title: "Estornos e reembolsos",
    description: "Confira valores e pedidos com reembolso total ou parcial.",
  },
  atendimento: {
    view: "operations",
    title: "Atendimento de pedidos",
    description: "Acompanhe pedidos em preparo, entregas e retiradas.",
  },
  produtos: {
    view: "products",
    title: "Produtos mais vendidos",
    description: "Consulte o ranking de produtos e variantes por período.",
  },
} as const;
export type SalesSection = keyof typeof salesPages;
export type SalesView = (typeof salesPages)[SalesSection]["view"];
type Search = Record<string, string | string[] | undefined>;

export default async function SalesWorkspace({
  section,
  searchParams,
}: {
  section: SalesSection;
  searchParams: Promise<Search>;
}) {
  await requireSession(["admin", "gestor"]);
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : "";
  const page = salesPages[section];
  const status =
    page.view === "refunds"
      ? "REFUNDS"
      : page.view === "receipts"
        ? "CASH_FLOW"
        : value("status") || "all";
  const input = {
    status,
    fulfillment:
      value("fulfillment") || (page.view === "operations" ? "AWAITING" : "all"),
    category: value("category"),
    delivery: value("delivery") || "all",
    start: value("start"),
    end: value("end"),
  };
  const parsed = salesFilterSchema.safeParse(input);
  const filters = parsed.success
    ? parsed.data
    : salesFilterSchema.parse({
        status:
          page.view === "refunds" || page.view === "receipts" ? status : "all",
        fulfillment: page.view === "operations" ? "AWAITING" : "all",
      });
  const days = [1, 7, 30, 60].includes(Number(value("days")))
    ? Number(value("days"))
    : 30;
  return (
    <>
      <PageHeading
        eyebrow="VENDAS SHOPIFY"
        title={page.title}
        description={page.description}
      />
      <SalesDashboard
        key={JSON.stringify([filters, days, page.view, value("metric")])}
        initialFilters={filters}
        initialDays={days}
        view={page.view}
        netFirst={value("metric") === "net"}
      />
    </>
  );
}
