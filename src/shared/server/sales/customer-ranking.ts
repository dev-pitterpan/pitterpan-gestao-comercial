import type { DateRange } from "../../lib/admin/date-range.ts";
import type { SqlClient } from "../database/catalog-repository.ts";
import { customerNameColumn } from "./customers.ts";

export const rankingPageSize = 10;
export const customerOrdersPageSize = 6;
export type RankingSort = "value" | "orders";

type RankedCustomer = {
  id: string;
  name: string;
  purchases: string;
  net: string;
  rank: number;
};

type CustomerOrder = {
  id: string;
  name: string;
  processed_at: string;
  fulfillment_status: string;
  received: string;
  refunded: string;
  net: string;
  items: {
    id: string;
    title: string;
    image: string | null;
    quantity: number;
  }[];
  item_count: number;
};

export async function readCustomerRanking(
  db: SqlClient,
  store: string,
  range: DateRange,
  sort: RankingSort,
  requestedPage: number,
  selectedId: string,
  requestedOrderPage: number,
) {
  const values = [store, range.start, range.end];
  const eligible = `o.store=$1 AND NOT o.test AND o.cancelled_at IS NULL
    AND o.currency='BRL' AND o.financial_status IN ('PAID','PARTIALLY_REFUNDED')
    AND o.received>o.refunded
    AND o.processed_at>=($2::date::timestamp AT TIME ZONE 'America/Sao_Paulo')
    AND o.processed_at<(($3::date+1)::timestamp AT TIME ZONE 'America/Sao_Paulo')`;
  const customerId = "to_jsonb(o)->'customer'->>'id'";
  const orderBy =
    sort === "orders"
      ? "purchases DESC, net DESC, id"
      : "net DESC, purchases DESC, id";
  const {
    rows: [result],
  } = await db.query<{
    customers: RankedCustomer[];
    selected: RankedCustomer | null;
    total: number;
    page: number;
  }>(
    `WITH purchases AS (
      SELECT ${customerId} AS id, ${customerNameColumn}, o.processed_at, o.id AS order_id,
             o.received-o.refunded AS net
      FROM pitterpan_sales_orders o
      WHERE ${eligible} AND ${customerId} ~ '^gid://shopify/Customer/[0-9]+$'
    ), grouped AS (
      SELECT id, (array_agg(customer_name ORDER BY processed_at DESC,order_id)
        FILTER (WHERE customer_name<>''))[1] AS name,
        count(*) AS purchases, sum(net) AS net
      FROM purchases GROUP BY id
    ), ranked AS (
      SELECT id, COALESCE(name,'') AS name, purchases::text AS purchases,
        net::text AS net, row_number() OVER (ORDER BY ${orderBy})::int AS rank
      FROM grouped
    ), bounds AS (
      SELECT count(*)::int AS total,
        LEAST($4::int,GREATEST(1,ceil(count(*)::numeric/$5::int)::int)) AS page
      FROM ranked
    )
    SELECT bounds.*,
      COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.rank) FROM ranked r
        WHERE r.rank > (bounds.page-1)*$5 AND r.rank <= bounds.page*$5),'[]') AS customers,
      (SELECT to_jsonb(r) FROM ranked r WHERE r.id=$6) AS selected
    FROM bounds`,
    [...values, requestedPage, rankingPageSize, selectedId],
  );
  const selected = result.selected ?? result.customers[0] ?? null;
  const orderTotal = Number(selected?.purchases ?? 0);
  const orderPages = Math.max(
    1,
    Math.ceil(orderTotal / customerOrdersPageSize),
  );
  const orderPage = Math.min(
    result.selected ? requestedOrderPage : 1,
    orderPages,
  );
  const orders = selected
    ? (
        await db.query<CustomerOrder>(
          `SELECT o.id,o.name,o.processed_at::text,o.fulfillment_status,
           o.received::text,o.refunded::text,(o.received-o.refunded)::text AS net,
           COALESCE(preview.items,'[]') AS items,COALESCE(preview.item_count,0) AS item_count
         FROM (
           SELECT o.* FROM pitterpan_sales_orders o
           WHERE ${eligible} AND ${customerId}=$4
           ORDER BY o.processed_at DESC,o.id DESC LIMIT $5 OFFSET $6
         ) o
         LEFT JOIN LATERAL (
           SELECT jsonb_agg(jsonb_build_object('id',i.id,'title',i.title,'image',i.image,'quantity',i.quantity)
               ORDER BY i.id) AS items, max(i.item_count)::int AS item_count
           FROM (
             SELECT i.id,i.title,to_jsonb(i)->>'image_url' AS image,i.quantity,count(*) OVER () AS item_count
             FROM pitterpan_sales_items i WHERE i.store=o.store AND i.order_id=o.id
             ORDER BY i.id LIMIT 3
           ) i
         ) preview ON true
         ORDER BY o.processed_at DESC,o.id DESC`,
          [
            ...values,
            selected.id,
            customerOrdersPageSize,
            (orderPage - 1) * customerOrdersPageSize,
          ],
        )
      ).rows
    : [];
  return { ...result, selected, orders, orderPage, orderPages };
}
