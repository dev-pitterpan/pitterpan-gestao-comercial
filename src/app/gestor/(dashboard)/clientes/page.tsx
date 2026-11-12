import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import CustomerRankingFilters from "@shared/components/admin/CustomerRankingFilters";
import OrderFulfillmentDetails from "@shared/components/admin/OrderFulfillmentDetails";
import ProductThumbnail from "@shared/components/admin/ProductThumbnail";
import TablePagination from "@shared/components/admin/TablePagination";
import {
  dateTime,
  EmptyState,
  number,
  PageHeading,
} from "@shared/components/admin/Primitives";
import {
  dateRangeSchema,
  shiftDate,
  todayDate,
} from "@shared/lib/admin/date-range";
import { fulfillmentLabels } from "@shared/lib/admin/fulfillment";
import { requireSession } from "@shared/server/auth/session";
import { database } from "@shared/server/database/client";
import { salesConfig, salesReady } from "@shared/server/sales/config";
import {
  rankingPageSize,
  readCustomerRanking,
} from "@shared/server/sales/customer-ranking";
import RankingMedal from "./RankingMedal";
import "./customer-ranking.css";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const money = (amount: string) => currency.format(Number(amount));
const pageNumber = (value: string | string[] | undefined) =>
  typeof value === "string" && /^[1-9]\d{0,5}$/.test(value) ? Number(value) : 1;

export default async function CustomerRankingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession(["admin", "gestor"]);
  const params = await searchParams;
  const end = todayDate();
  const parsed = dateRangeSchema.safeParse({
    start: params.start,
    end: params.end,
  });
  const range =
    parsed.success && parsed.data.start
      ? parsed.data
      : { start: shiftDate(end, -29), end };
  const sort = params.sort === "orders" ? "orders" : "value";
  const customer =
    typeof params.customer === "string" &&
    /^gid:\/\/shopify\/Customer\/\d{1,24}$/.test(params.customer)
      ? params.customer
      : "";
  const store = salesReady() ? salesConfig().SHOPIFY_SALES_STORE_DOMAIN : "";
  const data = store
    ? await readCustomerRanking(
        database(),
        store,
        range,
        sort,
        pageNumber(params.page),
        customer,
        pageNumber(params.pedidos),
      )
    : null;
  const pageHref = (page: number, id = "", orderPage = 1) =>
    `/gestor/clientes/?${new URLSearchParams({
      ...range,
      sort,
      page: String(page),
      ...(id ? { customer: id, pedidos: String(orderPage) } : {}),
    })}`;
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / rankingPageSize));
  const selected = data?.selected;
  return (
    <>
      <PageHeading
        title="Ranking de clientes"
        description="Compras identificadas na Shopify no período selecionado. O valor líquido desconta os reembolsos."
        filters={<CustomerRankingFilters range={range} sort={sort} />}
      />
      {!data || !selected ? (
        <section className="admin-panel">
          <EmptyState
            title={
              data
                ? "Nenhum cliente neste período"
                : "Vendas Shopify indisponíveis"
            }
            description={
              data
                ? "Escolha outro intervalo para consultar as compras sincronizadas."
                : "Confira a conexão e a sincronização de vendas no painel."
            }
          />
        </section>
      ) : (
        <div className="customer-ranking-layout">
          <section
            className="admin-panel customer-ranking-panel"
            aria-labelledby="ranking-list-title"
          >
            <h2 id="ranking-list-title">Classificação</h2>
            <ol
              className="customer-ranking-list"
              start={data.customers[0]?.rank ?? 1}
            >
              {data.customers.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`${pageHref(data.page, entry.id)}#compras-cliente`}
                    prefetch={false}
                    aria-current={entry.id === selected.id ? "true" : undefined}
                  >
                    <span className="customer-ranking-position">
                      <span className="admin-sr-only">{entry.rank}º lugar</span>
                      <RankingMedal rank={entry.rank} />
                    </span>
                    <div className="customer-ranking-identity">
                      <strong>
                        {entry.name || "Cliente sem nome informado"}
                      </strong>
                      <small>
                        {number(Number(entry.purchases))}{" "}
                        {entry.purchases === "1" ? "pedido" : "pedidos"}
                      </small>
                    </div>
                    <b>{money(entry.net)}</b>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
            <TablePagination
              label="Páginas do ranking"
              page={data.page}
              pages={pages}
              range={`${number(data.total)} ${data.total === 1 ? "cliente" : "clientes"}`}
              hrefs={{
                previous: data.page > 1 ? pageHref(data.page - 1) : undefined,
                next: data.page < pages ? pageHref(data.page + 1) : undefined,
              }}
            />
          </section>
          <section
            className="admin-panel customer-ranking-panel customer-ranking-orders"
            id="compras-cliente"
            aria-labelledby="ranking-orders-title"
          >
            <header>
              <h2 id="ranking-orders-title">
                {selected.name || "Cliente sem nome informado"}
              </h2>
              <p>
                {number(Number(selected.purchases))}{" "}
                {selected.purchases === "1" ? "pedido" : "pedidos"} no ranking ·{" "}
                <strong>{money(selected.net)} líquidos</strong>
              </p>
            </header>
            <ul className="customer-ranking-order-list">
              {data.orders.map((order) => (
                <li key={order.id} className="customer-ranking-order">
                  <div className="customer-ranking-order-header">
                    <div>
                      <a
                        href={`https://${store}/admin/orders/${order.id.split("/").at(-1)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {order.name}{" "}
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                      <small>
                        {dateTime(order.processed_at)} ·{" "}
                        {fulfillmentLabels[order.fulfillment_status] ??
                          order.fulfillment_status}
                      </small>
                    </div>
                    <div>
                      <strong>{money(order.net)} líquidos</strong>
                      {Number(order.refunded) > 0 && (
                        <small>
                          {money(order.received)} recebidos ·{" "}
                          {money(order.refunded)} reembolsados
                        </small>
                      )}
                    </div>
                  </div>
                  {order.items.length > 0 && (
                    <ul className="customer-ranking-products">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <ProductThumbnail src={item.image} />
                          <span>
                            {item.title}
                            <small>{number(item.quantity)} un.</small>
                          </span>
                        </li>
                      ))}
                      {order.item_count > order.items.length && (
                        <li className="customer-ranking-more">
                          +{order.item_count - order.items.length} na
                          conferência
                        </li>
                      )}
                    </ul>
                  )}
                  <OrderFulfillmentDetails
                    id={order.id}
                    name={order.name}
                    storedStatus={order.fulfillment_status}
                  />
                </li>
              ))}
            </ul>
            {data.orderPages > 1 && (
              <TablePagination
                label="Páginas de pedidos do cliente"
                page={data.orderPage}
                pages={data.orderPages}
                hrefs={{
                  previous:
                    data.orderPage > 1
                      ? pageHref(data.page, selected.id, data.orderPage - 1)
                      : undefined,
                  next:
                    data.orderPage < data.orderPages
                      ? pageHref(data.page, selected.id, data.orderPage + 1)
                      : undefined,
                }}
              />
            )}
          </section>
        </div>
      )}
    </>
  );
}
