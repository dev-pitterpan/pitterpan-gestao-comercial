import sharp from "sharp";
import { database } from "../database/client.ts";
import type { SqlClient } from "../database/catalog-repository.ts";
import { catalogImagesSchema } from "./schema.ts";
import { shopifyImageUrl } from "../shopify/media.ts";

async function hasImageTable(db: SqlClient) {
  const { rows } = await db.query<{ ready: boolean }>(
    "SELECT to_regclass('pitterpan_catalog_images') IS NOT NULL AS ready",
  );
  return rows[0]?.ready === true;
}

export async function ensureCatalogImages(db: SqlClient) {
  if (await hasImageTable(db)) return;
  try {
    await db.query(catalogImagesSchema);
  } catch (error) {
    // Concurrent requests can both reach CREATE before the relation is visible.
    const { code } = error as { code?: string };
    if ((code === "23505" || code === "42P07") && (await hasImageTable(db)))
      return;
    throw error;
  }
}

const sources = `SELECT DISTINCT ON (media.url) media.url AS source, i.name, coalesce(i.sku,i.id) AS sku
FROM catalog_state state JOIN catalog_items i ON i.import_id=state.active_import
CROSS JOIN LATERAL (
  SELECT i.image_url AS url
  UNION SELECT entry->>'url' FROM jsonb_array_elements(i.images) entry
) media
WHERE state.singleton AND media.url IS NOT NULL
ORDER BY media.url,i.variant_id`;

export async function listImages(
  search: string,
  status: string,
  page: number,
  days: number,
  db: SqlClient = database(),
) {
  await ensureCatalogImages(db);
  const { rows } = await db.query(
    `WITH sources AS (${sources}), inventory AS (
      SELECT coalesce(s.source,c.source) AS source, coalesce(s.name,c.name) AS name,
        coalesce(s.sku,c.sku) AS sku, coalesce(c.status,'pending') AS status,
        s.source IS NOT NULL AS active, c.original_format,c.original_width,c.original_height,
        c.original_bytes,c.webp_bytes,c.processed_at,c.error
      FROM sources s FULL JOIN pitterpan_catalog_images c ON c.source=s.source
    )
    SELECT * FROM inventory
    WHERE ($1='' OR strpos(lower(name), lower($1))>0 OR strpos(lower(sku), lower($1))>0)
    AND ($2='' OR status=$2) AND ($4::int=0 OR processed_at >= now() - $4::int * interval '1 day')
    ORDER BY active DESC,processed_at DESC NULLS LAST,source LIMIT 41 OFFSET $3`,
    [search, status, (page - 1) * 40, days],
  );
  return { images: rows.slice(0, 40), more: rows.length > 40 };
}

async function download(source: string) {
  const response = await fetch(source, {
    signal: AbortSignal.timeout(10000),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok || !response.body)
    throw new Error("Foto indisponível na Shopify.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 15_000_000) {
        await reader.cancel();
        throw new Error("Arquivo acima de 15 MB.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    reader.releaseLock();
  }
}

type Source = { source: string; name: string; sku: string };
async function convertImage(db: SqlClient, { source, name, sku }: Source) {
  try {
    const url = shopifyImageUrl(source);
    if (!url) throw new Error("Origem da foto inválida.");
    const original = await download(url);
    const image = sharp(original, { limitInputPixels: 40_000_000 });
    const { format, width, height, pages } = await image.metadata();
    if (
      !format ||
      !["jpeg", "png", "webp", "heif", "gif"].includes(format) ||
      !width ||
      !height
    )
      throw new Error("Formato de imagem incompatível.");
    if ((pages ?? 1) > 1)
      throw new Error("Imagem animada preservada no formato original.");
    const webp = await image
      .autoOrient()
      .resize(1000, 1000, { fit: "contain", background: "#fff" })
      .flatten({ background: "#fff" })
      .webp({ quality: 84 })
      .toBuffer();
    await db.query(
      `INSERT INTO pitterpan_catalog_images
       (source,name,sku,status,original_format,original_width,original_height,original_bytes,webp_bytes,webp)
       VALUES ($1,$2,$3,'completed',$4,$5,$6,$7,$8,$9)
       ON CONFLICT(source) DO UPDATE SET status='completed',original_format=excluded.original_format,
       original_width=excluded.original_width,original_height=excluded.original_height,
       original_bytes=excluded.original_bytes,webp_bytes=excluded.webp_bytes,webp=excluded.webp,
       processed_at=now(),error=NULL WHERE pitterpan_catalog_images.status<>'completed'`,
      [
        source,
        name,
        sku,
        format === "heif" ? "avif" : format,
        width,
        height,
        original.length,
        webp.length,
        webp,
      ],
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const detail = [
      "Foto indisponível na Shopify.",
      "Arquivo acima de 15 MB.",
      "Origem da foto inválida.",
      "Formato de imagem incompatível.",
      "Imagem animada preservada no formato original.",
    ].includes(message)
      ? message
      : "Falha ao baixar, converter ou salvar a foto.";
    await db.query(
      `INSERT INTO pitterpan_catalog_images (source,name,sku,status,error) VALUES ($1,$2,$3,'failed',$4)
       ON CONFLICT(source) DO UPDATE SET error=excluded.error,processed_at=now()
       WHERE pitterpan_catalog_images.status='failed'`,
      [source, name, sku, detail],
    );
    return false;
  }
}

export async function processImages(
  selected?: string[],
  limit = 12,
  db: SqlClient = database(),
) {
  await ensureCatalogImages(db);
  const { rows } = await db.query<Source>(
    `WITH sources AS (${sources})
     SELECT s.* FROM sources s LEFT JOIN pitterpan_catalog_images c ON c.source=s.source
     WHERE ($1::text[] IS NULL AND c.source IS NULL)
        OR ($1::text[] IS NOT NULL AND s.source=ANY($1) AND c.status IS DISTINCT FROM 'completed')
     ORDER BY s.source LIMIT $2`,
    [selected ?? null, limit],
  );
  let converted = 0;
  for (let i = 0; i < rows.length; i += 3) {
    const results = await Promise.all(
      rows.slice(i, i + 3).map((row) => convertImage(db, row)),
    );
    converted += results.filter(Boolean).length;
  }
  return {
    processed: rows.length,
    converted,
    failed: rows.length - converted,
    more: rows.length === limit && !selected,
  };
}
