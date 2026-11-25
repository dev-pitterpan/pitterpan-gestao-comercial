import type { SqlClient } from "../database/catalog-repository.ts";
import type { PrioritySelection } from "../../lib/admin/priorities.ts";
import { SALES_PAGE_SIZE } from "../../lib/admin/sales-links.ts";
import { awaitingFulfillmentSql } from "./fulfillment.ts";
import { fillQueueCatalogPhotos } from "./product-photos.ts";
import { shopifyImageUrl } from "../shopify/media.ts";
import { customerNameColumn } from "./customers.ts";

/** The caller uses a repeatable-read transaction: counts and rows describe the same queue. */
export async function readPriorityQueue(
  db: SqlClient,
  store: string,
  selection: PrioritySelection,
) {
  const open = `o.store=$1 AND NOT o.test AND ${awaitingFulfillmentSql}`;
  const { rows: counts } = await db.query<{
    preparing: string;
    ready: string;
    oldest_at: string | null;
  }>(
    `SELECT count(*) FILTER(WHERE fulfillment_status<>'READY_FOR_PICKUP')::text AS preparing, count(*) FILTER(WHERE fulfillment_status='READY_FOR_PICKUP')::text AS ready,min(processed_at)::text AS oldest_at FROM pitterpan_sales_orders o WHERE ${open}`,
    [store],
  );
  const countsRow = counts[0];
  const total =
    selection.stage === "ready"
      ? Number(countsRow.ready)
      : selection.stage === "preparing"
        ? Number(countsRow.preparing)
        : Number(countsRow.preparing) + Number(countsRow.ready);
  const pages = Math.max(1, Math.ceil(total / SALES_PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(selection.page) || 1));
  const stage =
    selection.stage === "ready"
      ? "AND o.fulfillment_status='READY_FOR_PICKUP'"
      : selection.stage === "preparing"
        ? "AND o.fulfillment_status<>'READY_FOR_PICKUP'"
        : "";
  const direction = selection.sort === "newest" ? "DESC" : "ASC";
  const orders = await db.query<{
    id: string;
    name: string;
    customer_name: string | null;
    processed_at: string;
    fulfillment_status: string;
    delivery_kind: string;
    delivery_label: string;
    total: string;
    currency: string;
    image_url: string | null;
    fallback_image_url?: string | null;
    variant_id: string | null;
    product_id: string | null;
    item_title: string | null;
    item_count: string;
    units: string;
  }>(
    `SELECT o.id,o.name,${customerNameColumn},o.processed_at::text,o.fulfillment_status,o.delivery_kind,o.delivery_label,o.total::text,o.currency,preview.image_url,preview.variant_id,preview.product_id,preview.title AS item_title,items.item_count,items.units FROM pitterpan_sales_orders o LEFT JOIN LATERAL (SELECT i.image_url,i.variant_id,i.product_id,i.title FROM pitterpan_sales_items i WHERE i.store=o.store AND i.order_id=o.id AND i.current_quantity>0 ORDER BY (i.image_url IS NULL OR i.image_url=''),i.id LIMIT 1) preview ON true LEFT JOIN LATERAL (SELECT count(*)::text AS item_count,COALESCE(sum(i.current_quantity),0)::text AS units FROM pitterpan_sales_items i WHERE i.store=o.store AND i.order_id=o.id AND i.current_quantity>0) items ON true WHERE ${open} ${stage} ORDER BY o.processed_at ${direction},o.id ${direction} LIMIT $2 OFFSET $3`,
    [store, SALES_PAGE_SIZE, (page - 1) * SALES_PAGE_SIZE],
  );
  for (const row of orders.rows) row.image_url = shopifyImageUrl(row.image_url);
  await fillQueueCatalogPhotos(db, store, orders.rows);
  const sync = await db.query<{
    completed_at: string | null;
    until_at: string | null;
  }>(
    "SELECT completed_at::text,until_at::text FROM pitterpan_sales_sync WHERE store=$1",
    [store],
  );
  return {
    counts: countsRow,
    total,
    pages,
    page,
    orders: orders.rows,
    sync: sync.rows[0] || null,
    store,
  };
}
