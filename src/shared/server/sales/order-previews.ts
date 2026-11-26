import type { SqlClient } from "../database/catalog-repository.ts";
import { shopifyImageUrl } from "../shopify/media.ts";
import { fillQueueCatalogPhotos, type QueuePhoto } from "./product-photos.ts";
export type OrderProductPreview = QueuePhoto & {
  title: string;
  quantity: number;
};
type PreviewRow = OrderProductPreview & {
  order_id: string;
  item_count: string;
  units: string;
};
/** Only the visible orders and three original line items per order; never match by SKU/title. */
export async function readOrderPreviews(
  db: SqlClient,
  store: string,
  orderIds: string[],
) {
  const result = new Map<
    string,
    { products: OrderProductPreview[]; item_count: string; units: string }
  >();
  if (!orderIds.length) return result;
  const { rows } = await db.query<PreviewRow>(
    `SELECT id,order_id,variant_id,product_id,title,quantity,image_url,item_count,units FROM (
 SELECT i.id,i.order_id,i.variant_id,i.product_id,i.title,i.quantity,to_jsonb(i)->>'image_url' AS image_url,
 count(*) OVER(PARTITION BY i.order_id)::text AS item_count,sum(i.quantity) OVER(PARTITION BY i.order_id)::text AS units,
 row_number() OVER(PARTITION BY i.order_id ORDER BY (NULLIF(to_jsonb(i)->>'image_url','') IS NULL),i.id) AS position
 FROM pitterpan_sales_items i WHERE i.store=$1 AND i.order_id=ANY($2::text[]) AND i.quantity>0
 ) preview WHERE position<=3 ORDER BY order_id,position`,
    [store, orderIds],
  );
  for (const row of rows) row.image_url = shopifyImageUrl(row.image_url);
  await fillQueueCatalogPhotos(db, store, rows);
  for (const row of rows) {
    const group = result.get(row.order_id) ?? {
      products: [],
      item_count: row.item_count,
      units: row.units,
    };
    group.products.push({
      id: row.id,
      variant_id: row.variant_id,
      product_id: row.product_id,
      title: row.title,
      quantity: row.quantity,
      image_url: row.image_url,
      fallback_image_url: row.fallback_image_url,
    });
    result.set(row.order_id, group);
  }
  return result;
}
