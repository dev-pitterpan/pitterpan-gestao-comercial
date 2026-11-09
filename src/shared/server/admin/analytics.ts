import {
  activeSnapshot,
  type SqlClient,
} from "../database/catalog-repository.ts";
import type { AdminContext, AdminSummary, ImportRun } from "./repository.ts";
/** Comparação dos campos sincronizados, compartilhada pelo resumo e pelo histórico. */
export const shopifyChangedFieldsSql = `array_remove(ARRAY[
        CASE WHEN a.name IS DISTINCT FROM b.name THEN 'Nome' END,
        CASE WHEN ROW(a.price,a.currency) IS DISTINCT FROM ROW(b.price,b.currency) THEN 'Preço' END,
        CASE WHEN a.inventory_quantity IS DISTINCT FROM b.inventory_quantity THEN 'Estoque' END,
        CASE WHEN a.image_url IS DISTINCT FROM b.image_url THEN 'Foto' END,
        CASE WHEN a.category IS DISTINCT FROM b.category THEN 'Categoria' END,
        CASE WHEN a.sku IS DISTINCT FROM b.sku THEN 'SKU' END,
        CASE WHEN a.vendor IS DISTINCT FROM b.vendor THEN 'Marca' END,
        CASE WHEN a.description IS DISTINCT FROM b.description THEN 'Descrição' END,
        CASE WHEN a.compare_at_price IS DISTINCT FROM b.compare_at_price THEN 'Preço de comparação' END
      ],NULL)`;
const settingsDefaults = { low: 5, high: 100 };
const summaryEmpty = {
  products: 0,
  variants: 0,
  categories: 0,
  brands: 0,
  offers: 0,
  low: 0,
  high: 0,
  out: 0,
  unknown: 0,
  units: 0,
};
export async function readSettings(db: SqlClient) {
  const { rows } = await db.query<{ low_stock: number; high_stock: number }>(
    "SELECT low_stock,high_stock FROM pitterpan_admin_settings WHERE singleton=true",
  );
  return rows[0]
    ? { low: rows[0].low_stock, high: rows[0].high_stock }
    : settingsDefaults;
}

export type CatalogView =
  "overview" | "basic" | "stock" | "history" | "changes";

export async function readAnalytics(
  db: SqlClient,
  view: CatalogView = "overview",
): Promise<AdminContext> {
  const [active, settings] = await Promise.all([
    activeSnapshot(db),
    readSettings(db),
  ]);
  const overview = view === "overview";
  const [totals, categoryResult, history, previousResult] = await Promise.all([
    (overview || view === "stock") &&
      db.query<Record<string, string>>(
        `SELECT count(DISTINCT product_id)::text AS products,count(*)::text AS variants,count(DISTINCT category)::text AS categories,count(DISTINCT NULLIF(vendor,''))::text AS brands,
     count(*) FILTER(WHERE compare_at_price>price)::text AS offers,
     count(*) FILTER(WHERE inventory_quantity>0 AND inventory_quantity<=$2)::text AS low,
     count(*) FILTER(WHERE inventory_quantity>=$3)::text AS high,
     count(*) FILTER(WHERE inventory_quantity<=0)::text AS out,
     count(*) FILTER(WHERE inventory_quantity IS NULL)::text AS unknown,
     COALESCE(sum(GREATEST(inventory_quantity,0)),0)::text AS units
     FROM catalog_items WHERE import_id=$1`,
        [active, settings.low, settings.high],
      ),
    overview &&
      db.query<{ name: string; count: string }>(
        "SELECT category AS name,count(*)::text AS count FROM catalog_items WHERE import_id=$1 GROUP BY category ORDER BY count(*) DESC,category LIMIT 6",
        [active],
      ),
    (overview || view === "history") &&
      db.query<ImportRun>(
        `WITH recent AS (SELECT id,status,started_at,completed_at,report FROM catalog_imports ORDER BY started_at DESC LIMIT 20),
        visible AS (
          SELECT * FROM recent
          UNION ALL
          SELECT id,status,started_at,completed_at,report FROM catalog_imports
          WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM recent WHERE id=$1)
        )
        SELECT id,status,started_at::text,completed_at::text,report FROM visible ORDER BY visible.started_at DESC`,
        [active],
      ),
    (overview || view === "changes") &&
      db.query<{ id: string }>(
        "SELECT id FROM catalog_imports WHERE status='retired' AND store_domain=(SELECT store_domain FROM catalog_imports WHERE id=$1) ORDER BY completed_at DESC NULLS LAST,started_at DESC LIMIT 1",
        [active],
      ),
  ]);
  const previous = (previousResult && previousResult.rows[0]?.id) || null;
  let changes: AdminContext["changes"] = null;
  if (overview && previous) {
    const { rows } = await db.query<{
      added: string;
      removed: string;
      changed: string;
    }>(
      `WITH a AS(SELECT * FROM catalog_items WHERE import_id=$1),b AS(SELECT * FROM catalog_items WHERE import_id=$2)
     SELECT count(*) FILTER(WHERE b.variant_id IS NULL)::text AS added,count(*) FILTER(WHERE a.variant_id IS NULL)::text AS removed,
     count(*) FILTER(WHERE a.variant_id IS NOT NULL AND b.variant_id IS NOT NULL AND cardinality(${shopifyChangedFieldsSql}) > 0)::text AS changed FROM a FULL JOIN b USING(variant_id)`,
      [active, previous],
    );
    changes = {
      added: Number(rows[0].added),
      removed: Number(rows[0].removed),
      changed: Number(rows[0].changed),
    };
  }
  return {
    source: "postgres",
    notice: null,
    active,
    previous,
    settings,
    summary: totals
      ? (Object.fromEntries(
          Object.keys(summaryEmpty).map((k) => [k, Number(totals.rows[0][k])]),
        ) as AdminSummary)
      : null,
    categories: categoryResult
      ? categoryResult.rows.map((c) => ({
          ...c,
          count: Number(c.count),
        }))
      : [],
    runs: history ? history.rows : [],
    changes,
  };
}
