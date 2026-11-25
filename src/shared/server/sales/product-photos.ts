import type { SqlClient } from "../database/catalog-repository.ts";
import { shopifyImageUrl } from "../shopify/media.ts";

export type QueuePhoto = {
  id: string;
  variant_id: string | null;
  product_id: string | null;
  image_url: string | null;
  fallback_image_url?: string | null;
};
type PhotoClient = {
  query<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
};
const variantId = (value: string | null) =>
  /^gid:\/\/shopify\/ProductVariant\/[1-9]\d*$/.test(value || "");
const productId = (value: string | null) =>
  /^gid:\/\/shopify\/Product\/[1-9]\d*$/.test(value || "");

/** Historical photos may be missing or point to removed files. Only use the active catalog of the same store. */
export async function fillQueueCatalogPhotos(
  db: SqlClient,
  store: string,
  rows: QueuePhoto[],
) {
  const candidates = rows.filter(
    (row) => variantId(row.variant_id) || productId(row.product_id),
  );
  if (!candidates.length) return;
  const available = await db.query<{ exists: boolean }>(
    "SELECT to_regclass('catalog_items') IS NOT NULL AND to_regclass('catalog_state') IS NOT NULL AND to_regclass('catalog_imports') IS NOT NULL AS exists",
  );
  if (!available.rows[0].exists) return;
  const photos = await db.query<{ id: string; image_url: string }>(
    `SELECT x.id,ci.image_url FROM jsonb_to_recordset($1::jsonb) x(id text,variant_id text,product_id text)
     JOIN catalog_state cs ON cs.singleton=true
     JOIN catalog_imports catalog_import ON catalog_import.id=cs.active_import AND catalog_import.store_domain=$2
     JOIN catalog_items ci ON ci.import_id=catalog_import.id AND
       (('gid://shopify/ProductVariant/'||ci.variant_id=x.variant_id AND (x.product_id IS NULL OR ci.product_id=x.product_id))
        OR (x.variant_id IS NULL AND ci.product_id=x.product_id))
     WHERE ci.image_url IS NOT NULL ORDER BY x.id,ci.variant_id`,
    [
      JSON.stringify(
        candidates.map(({ id, variant_id, product_id }) => ({
          id,
          variant_id,
          product_id,
        })),
      ),
      store,
    ],
  );
  for (const row of candidates) {
    const image =
      photos.rows
        .filter((photo) => photo.id === row.id)
        .map((photo) => shopifyImageUrl(photo.image_url))
        .find(Boolean) || null;
    preferCurrentPhoto(row, image);
  }
}

/** Refresh this page's photos even when historical URLs are populated. Never match by title/SKU. */
export async function fillQueueLivePhotos(
  rows: QueuePhoto[],
  client: PhotoClient,
) {
  const candidates = rows.filter(
    (row) => variantId(row.variant_id) || productId(row.product_id),
  );
  const ids = [
    ...new Set(
      candidates
        .flatMap((row) => [
          variantId(row.variant_id) ? row.variant_id! : "",
          productId(row.product_id) ? row.product_id! : "",
        ])
        .filter(Boolean),
    ),
  ];
  if (!ids.length) return;
  type Photo = {
    id: string;
    media?: { nodes: { image?: { url: string } | null }[] };
    featuredMedia?: { image?: { url: string } | null } | null;
    product?: {
      id: string;
      featuredMedia: { image?: { url: string } | null } | null;
    };
  };
  const { nodes } = await client.query<{ nodes: (Photo | null)[] }>(
    `query QueueProductPhotosV2($ids:[ID!]!){nodes(ids:$ids){... on ProductVariant{id media(first:10){nodes{... on MediaImage{image{url}}}} product{id featuredMedia{... on MediaImage{image{url}}}}} ... on Product{id featuredMedia{... on MediaImage{image{url}}}}}}`,
    { ids },
  );
  const byId = new Map(
    nodes
      .filter((node): node is Photo => !!node)
      .map((node) => [node.id, node]),
  );
  for (const row of candidates) {
    const variant = row.variant_id ? byId.get(row.variant_id) : null;
    const product = row.product_id ? byId.get(row.product_id) : null;
    const matches =
      variant && (!row.product_id || variant.product?.id === row.product_id);
    const image =
      (matches &&
        (variant.media?.nodes
          .map((media) => shopifyImageUrl(media.image?.url))
          .find(Boolean) ||
          shopifyImageUrl(variant.product?.featuredMedia?.image?.url))) ||
      shopifyImageUrl(product?.featuredMedia?.image?.url) ||
      null;
    preferCurrentPhoto(row, image);
  }
}

/** A populated historical URL may already be broken. Keep it only as a secondary candidate. */
function preferCurrentPhoto(row: QueuePhoto, current: string | null) {
  if (!current) return;
  const previous = shopifyImageUrl(row.image_url);
  if (previous && previous !== current && !row.fallback_image_url)
    row.fallback_image_url = previous;
  row.image_url = current;
}
