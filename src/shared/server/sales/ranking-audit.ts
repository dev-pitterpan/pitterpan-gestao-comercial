import { z } from "zod";
import { dateRangeSchema, shiftDate } from "../../lib/admin/date-range.ts";
import type { SqlClient } from "../database/catalog-repository.ts";
import { financialCents } from "./audit.ts";
import { orderSchema } from "./model.ts";

const remoteOrder = z
  .object(orderSchema.shape)
  .pick({
    id: true,
    processedAt: true,
    cancelledAt: true,
    test: true,
    displayFinancialStatus: true,
    totalReceivedSet: true,
    totalRefundedSet: true,
  })
  .extend({
    customer: z
      .object({ id: z.string().regex(/^gid:\/\/shopify\/Customer\/\d+$/) })
      .nullable(),
  });
const response = z.object({
  orders: z.object({
    nodes: z.array(remoteOrder),
    pageInfo: z.object({
      hasNextPage: z.boolean(),
      endCursor: z.string().nullable(),
    }),
  }),
});
type Client = {
  query<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
};

/** Read-only comparison of every customer's count and exact net amount. No names leave this report. */
export async function auditCustomerRanking(
  db: SqlClient,
  client: Client,
  store: string,
  start: string,
  end: string,
) {
  dateRangeSchema.parse({ start, end });
  if (!start || !end) throw new Error("Informe o período da auditoria.");
  const expected = new Map<string, { purchases: number; net: bigint }>();
  const seenOrders = new Set<string>(),
    seenCursors = new Set<string>();
  const from = Date.parse(`${start}T00:00:00-03:00`),
    until = Date.parse(`${shiftDate(end, 1)}T00:00:00-03:00`);
  const filter = `test:false processed_at:>=${start}T00:00:00-03:00 processed_at:<${shiftDate(end, 1)}T00:00:00-03:00`;
  let after: string | null = null,
    eligible = 0,
    unidentified = 0;
  for (let page = 0; ; page++) {
    if (page >= 1000)
      throw new Error("Limite de páginas da auditoria atingido.");
    const data: z.infer<typeof response>["orders"] = response.parse(
      await client.query(
        `query RankingAudit($after:String,$filter:String!){orders(first:100,after:$after,query:$filter,sortKey:PROCESSED_AT){nodes{id processedAt cancelledAt test displayFinancialStatus customer{id} totalReceivedSet{shopMoney{amount currencyCode}} totalRefundedSet{shopMoney{amount currencyCode}}} pageInfo{hasNextPage endCursor}}}`,
        { after, filter },
      ),
    ).orders;
    for (const order of data.nodes) {
      if (seenOrders.has(order.id))
        throw new Error(
          "Pedido repetido durante a auditoria; tente novamente.",
        );
      seenOrders.add(order.id);
      const processed = Date.parse(order.processedAt);
      const net =
        financialCents(order.totalReceivedSet.shopMoney.amount) -
        financialCents(order.totalRefundedSet.shopMoney.amount);
      if (
        order.test ||
        order.cancelledAt ||
        processed < from ||
        processed >= until ||
        !["PAID", "PARTIALLY_REFUNDED"].includes(
          order.displayFinancialStatus || "",
        ) ||
        order.totalReceivedSet.shopMoney.currencyCode !== "BRL" ||
        order.totalRefundedSet.shopMoney.currencyCode !== "BRL" ||
        net <= 0n
      )
        continue;
      eligible++;
      if (!order.customer) {
        unidentified++;
        continue;
      }
      const current = expected.get(order.customer.id) || {
        purchases: 0,
        net: 0n,
      };
      current.purchases++;
      current.net += net;
      expected.set(order.customer.id, current);
    }
    if (!data.pageInfo.hasNextPage) break;
    const cursor: string | null = data.pageInfo.endCursor;
    if (!cursor || seenCursors.has(cursor) || !data.nodes.length)
      throw new Error("Paginação de auditoria sem progresso.");
    seenCursors.add(cursor);
    after = cursor;
  }
  const { rows } = await db.query<{
    id: string | null;
    purchases: string;
    net: string;
  }>(
    `SELECT to_jsonb(o)->'customer'->>'id' AS id,count(*)::text AS purchases,sum(o.received-o.refunded)::text AS net
     FROM pitterpan_sales_orders o WHERE o.store=$1 AND NOT o.test AND o.cancelled_at IS NULL
     AND o.currency='BRL' AND o.financial_status IN ('PAID','PARTIALLY_REFUNDED') AND o.received>o.refunded
     AND o.processed_at>=($2::date::timestamp AT TIME ZONE 'America/Sao_Paulo')
     AND o.processed_at<(($3::date+1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
     GROUP BY to_jsonb(o)->'customer'->>'id'`,
    [store, start, end],
  );
  const local = new Map(
    rows
      .filter(
        (row) => row.id && /^gid:\/\/shopify\/Customer\/\d+$/.test(row.id),
      )
      .map((row) => [row.id!, row]),
  );
  const counts = {
    shopifyOrders: seenOrders.size,
    eligibleOrders: eligible,
    unidentifiedShopifyOrders: unidentified,
    unidentifiedLocalOrders: rows
      .filter((row) => !local.has(row.id!))
      .reduce((sum, row) => sum + Number(row.purchases), 0),
    shopifyCustomers: expected.size,
    localCustomers: local.size,
    missingCustomers: 0,
    extraCustomers: 0,
    divergentCustomers: 0,
  };
  for (const [id, value] of expected) {
    const actual = local.get(id);
    if (!actual) counts.missingCustomers++;
    else if (
      Number(actual.purchases) !== value.purchases ||
      financialCents(actual.net) !== value.net
    )
      counts.divergentCustomers++;
  }
  for (const id of local.keys()) if (!expected.has(id)) counts.extraCustomers++;
  return {
    window: { start, end },
    timezone: "America/Sao_Paulo",
    counts,
    consistent:
      counts.missingCustomers +
        counts.extraCustomers +
        counts.divergentCustomers ===
        0 &&
      counts.unidentifiedLocalOrders === counts.unidentifiedShopifyOrders,
  };
}
