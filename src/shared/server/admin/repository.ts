import { stockFilters, matchesStock } from "../../lib/admin/stock.ts";
import { stockSelectionSql } from "./stock.ts";
import { containsPattern, matchesFilter } from "../../lib/admin/filters.ts";
import {
  readAnalytics,
  shopifyChangedFieldsSql,
  type CatalogView,
} from "./analytics";
import { requireSession } from "../auth/session";
import { cache } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { database } from "../database/client";
import {
  departmentHandles,
  storefrontNavigation,
} from "../../lib/catalog/departments";
import { getManifest, getConfig } from "../catalogs";
import { moneyToMinor } from "../../lib/money";
import type { Product } from "../../types/catalog";
export type AdminProduct = Product & { inventoryQuantity: number | null };
export type AdminSummary = {
  products: number;
  variants: number;
  categories: number;
  brands: number;
  offers: number;
  low: number;
  high: number;
  out: number;
  unknown: number;
  units: number;
};
export type ImportRun = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  report: {
    products?: number;
    variants?: number;
    missingImages?: number;
    unassigned?: number;
  };
};
export type AdminContext = {
  source: "postgres" | "json" | "pending";
  notice: string | null;
  active: string | null;
  previous: string | null;
  settings: { low: number; high: number };
  summary: AdminSummary | null;
  categories: { name: string; count: number }[];
  runs: ImportRun[];
  changes: { added: number; removed: number; changed: number } | null;
};
export const settingsDefaults = { low: 5, high: 100 };
const summaryEmpty: AdminSummary = {
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
export const localProducts = cache(async () => {
  const manifest = JSON.parse(
    await readFile(
      join(process.cwd(), "public/data/catalogs/manifest.json"),
      "utf8",
    ),
  );
  const catalogs = await Promise.all(
    manifest.catalogs.map(async ({ slug }: { slug: string }) =>
      JSON.parse(
        await readFile(
          join(process.cwd(), `public/data/catalogs/${slug}.json`),
          "utf8",
        ),
      ),
    ),
  );
  return catalogs.flatMap((c) =>
    c.products.map((p: Product) => ({
      ...p,
      inventoryQuantity: p.inventoryQuantity ?? null,
    })),
  ) as AdminProduct[];
});
export function summarize(
  products: AdminProduct[],
  settings = settingsDefaults,
): AdminSummary {
  return {
    ...summaryEmpty,
    products: new Set(products.map((p) => p.shopifyProductId || p.id)).size,
    variants: products.length,
    categories: new Set(products.map((p) => p.category).filter(Boolean)).size,
    brands: new Set(products.map((p) => p.vendor).filter(Boolean)).size,
    offers: products.filter(
      (p) =>
        p.price !== undefined &&
        p.compareAtPrice &&
        moneyToMinor(p.compareAtPrice) > moneyToMinor(p.price),
    ).length,
    low: products.filter(
      (p) =>
        p.inventoryQuantity !== null &&
        p.inventoryQuantity > 0 &&
        p.inventoryQuantity <= settings.low,
    ).length,
    high: products.filter(
      (p) =>
        p.inventoryQuantity !== null && p.inventoryQuantity >= settings.high,
    ).length,
    out: products.filter(
      (p) => p.inventoryQuantity !== null && p.inventoryQuantity <= 0,
    ).length,
    unknown: products.filter((p) => p.inventoryQuantity === null).length,
    units: products.reduce(
      (n, p) => n + Math.max(0, p.inventoryQuantity || 0),
      0,
    ),
  };
}
/** Cada indicador usa a mesma versão publicada; não consulta 13 mil itens na Shopify. */
export const adminContext = cache(
  async (view: CatalogView = "overview"): Promise<AdminContext> => {
    await requireSession();
    if (process.env.DATABASE_URL) {
      try {
        return await readAnalytics(database(), view);
      } catch {
        return {
          source: "pending",
          notice:
            "O painel aguarda uma importação publicada e a preparação do banco. Nenhum indicador é estimado.",
          active: null,
          previous: null,
          settings: settingsDefaults,
          summary: null,
          categories: [],
          runs: [],
          changes: null,
        };
      }
    }
    if ((process.env.CATALOG_DATA_SOURCE || "json") === "json") {
      const products =
        view === "overview" || view === "stock" ? await localProducts() : [];
      const counts = new Map<string, number>();
      for (const p of products)
        counts.set(
          p.category || "Sem categoria",
          (counts.get(p.category || "Sem categoria") || 0) + 1,
        );
      return {
        source: "json",
        notice:
          "Dados dos arquivos locais. Estoque e histórico só aparecem quando informados pela integração.",
        active: null,
        previous: null,
        settings: settingsDefaults,
        summary:
          view === "overview" || view === "stock" ? summarize(products) : null,
        categories: [...counts]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6),
        runs: [],
        changes: null,
      };
    }
    return {
      source: "pending",
      notice:
        "Conecte o banco e publique a primeira importação para acompanhar a loja completa. Os catálogos públicos continuam na fonte atual.",
      active: null,
      previous: null,
      settings: settingsDefaults,
      summary: null,
      categories: [],
      runs: [],
      changes: null,
    };
  },
);
export const adminQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  category: z.string().max(200).default(""),
  vendor: z.string().max(200).default(""),
  stock: z.enum(stockFilters).default("all"),
  offers: z.enum(["0", "1"]).default("0"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export type AdminQuery = z.infer<typeof adminQuerySchema>;
const selectProduct =
  '\'shopify-\'||variant_id AS id,COALESCE(sku,id) AS sku,name,description,category,vendor,price::text,compare_at_price::text AS "compareAtPrice",currency,image_url AS image,inventory_quantity AS "inventoryQuantity",variant_id AS "shopifyVariantId",site_url AS "siteUrl"';
export const ADMIN_PRODUCT_PAGE_SIZE = 20;
export async function adminProducts(
  input: AdminQuery,
  {
    all = false,
    view = "basic",
  }: { all?: boolean; view?: "basic" | "stock" } = {},
) {
  const context = await adminContext(view);
  if (context.source === "pending")
    return { products: [] as AdminProduct[], total: 0, pages: 1, page: 1 };
  if (context.source === "json") {
    const products = (await localProducts()).filter(
      (p) =>
        [p.name, p.sku || p.id, p.vendor]
          .join(" ")
          .toLowerCase()
          .includes(input.q.toLowerCase()) &&
        matchesFilter(p.category, input.category) &&
        matchesFilter(p.vendor, input.vendor) &&
        (input.offers !== "1" ||
          (p.price !== undefined &&
            p.compareAtPrice &&
            moneyToMinor(p.compareAtPrice) > moneyToMinor(p.price))) &&
        matchesStock(
          p.inventoryQuantity,
          input.stock,
          context.settings.low,
          context.settings.high,
        ),
    );
    const pages = Math.max(
      1,
      Math.ceil(products.length / ADMIN_PRODUCT_PAGE_SIZE),
    );
    const page = Math.min(input.page, pages);
    return {
      products: all
        ? products
        : products.slice(
            (page - 1) * ADMIN_PRODUCT_PAGE_SIZE,
            page * ADMIN_PRODUCT_PAGE_SIZE,
          ),
      total: products.length,
      pages,
      page,
    };
  }
  const values = [
    context.active,
    `%${input.q.replace(/[\\%_]/g, "\\$&")}%`,
    containsPattern(input.category),
    containsPattern(input.vendor),
    input.offers,
    input.stock,
    context.settings.low,
    context.settings.high,
  ];
  const where = `import_id=$1 AND (name ILIKE $2 OR COALESCE(sku,id) ILIKE $2 OR vendor ILIKE $2) AND ($3='%%' OR category ILIKE $3) AND ($4='%%' OR vendor ILIKE $4) AND ($5='0' OR compare_at_price>price)
 AND ${stockSelectionSql}`;
  const count = await database().query<{ total: string }>(
    `SELECT count(*)::text AS total FROM catalog_items WHERE ${where}`,
    values,
  );
  const total = Number(count.rows[0].total),
    pages = Math.max(1, Math.ceil(total / ADMIN_PRODUCT_PAGE_SIZE)),
    page = Math.min(input.page, pages);
  const { rows } = await database().query<AdminProduct>(
    `SELECT ${selectProduct} FROM catalog_items WHERE ${where} ORDER BY name,variant_id${all ? "" : ` LIMIT ${ADMIN_PRODUCT_PAGE_SIZE} OFFSET $9`}`,
    all ? values : [...values, (page - 1) * ADMIN_PRODUCT_PAGE_SIZE],
  );
  return {
    products: rows.map((p) => ({
      ...p,
      image: p.image || "/assets/images/brand/product-placeholder.svg",
    })),
    total,
    pages,
    page,
  };
}
export async function adminChanges(
  page: number,
  range = { start: "", end: "" },
  kind = "all",
) {
  const context = await adminContext("changes");
  const empty = {
    items: [] as ChangeRow[],
    total: 0,
    pages: 1,
    page: 1,
    counts: { added: 0, removed: 0, changed: 0 },
  };
  if (!context.active || !context.previous) return empty;
  const sql = `WITH versions AS (
    SELECT id,store_domain,completed_at,lag(id) OVER(PARTITION BY store_domain ORDER BY completed_at,id) AS previous
    FROM catalog_imports WHERE status IN ('active','retired') AND completed_at IS NOT NULL
    AND store_domain=(SELECT store_domain FROM catalog_imports WHERE id=$1)
  ), pairs AS (
    SELECT * FROM versions WHERE previous IS NOT NULL AND
    (($2='' AND id=$1) OR ($2<>'' AND completed_at >= (NULLIF($2,'')::date::timestamp AT TIME ZONE 'America/Sao_Paulo') AND completed_at < ((NULLIF($3,'')::date+1)::timestamp AT TIME ZONE 'America/Sao_Paulo')))
  ), changes AS (
    SELECT p.id AS version,p.completed_at::text AS recorded_at,p.store_domain,c.* FROM pairs p
    CROSS JOIN LATERAL (
      SELECT COALESCE(a.variant_id,b.variant_id) AS id,COALESCE(a.name,b.name) AS name,CASE WHEN a.variant_id IS NULL THEN b.sku ELSE a.sku END AS sku,COALESCE(a.image_url,b.image_url) AS image,
      CASE WHEN b.variant_id IS NULL THEN 'added' WHEN a.variant_id IS NULL THEN 'removed' ELSE 'changed' END AS kind,
      a.price::text AS price,b.price::text AS old_price,a.currency,b.currency AS old_currency,a.inventory_quantity AS stock,b.inventory_quantity AS old_stock,
      a.product_id,
      b.name AS old_name,b.sku AS old_sku,a.sku AS current_sku,
      b.description AS old_description,a.description,
      b.vendor AS old_vendor,a.vendor AS vendor,b.category AS old_category,a.category,
      b.compare_at_price::text AS old_compare_at_price,a.compare_at_price::text AS compare_at_price,
      CASE WHEN a.updated_at IS DISTINCT FROM b.updated_at THEN a.updated_at END AS shopify_updated_at,
      ${shopifyChangedFieldsSql} AS fields
      FROM (SELECT * FROM catalog_items WHERE import_id=p.id) a
      FULL JOIN (SELECT * FROM catalog_items WHERE import_id=p.previous) b USING(variant_id)
      WHERE a.variant_id IS NULL OR b.variant_id IS NULL OR cardinality(${shopifyChangedFieldsSql}) > 0
    ) c
  )`;
  const values = [context.active, range.start, range.end];
  const totals = await database().query<{
    added: string;
    removed: string;
    changed: string;
  }>(
    `${sql} SELECT count(*) FILTER(WHERE kind='added')::text AS added,count(*) FILTER(WHERE kind='removed')::text AS removed,count(*) FILTER(WHERE kind='changed')::text AS changed FROM changes`,
    values,
  );
  const counts = {
    added: Number(totals.rows[0].added),
    removed: Number(totals.rows[0].removed),
    changed: Number(totals.rows[0].changed),
  };
  const total =
    kind === "all"
      ? counts.added + counts.removed + counts.changed
      : counts[kind as keyof typeof counts];
  const pages = Math.max(1, Math.ceil(total / 20));
  page = Math.min(page, pages);
  const { rows } = await database().query<ChangeRow>(
    `${sql} SELECT * FROM changes WHERE ($5='all' OR kind=$5) ORDER BY recorded_at DESC,version,kind,name,id LIMIT 20 OFFSET $4`,
    [...values, (page - 1) * 20, kind],
  );
  return { items: rows, total, pages, page, counts };
}
type ChangeRow = {
  version: string;
  recorded_at: string;
  shopify_updated_at: string | null;
  store_domain: string;
  product_id: string | null;
  old_name: string | null;
  old_sku: string | null;
  current_sku: string | null;
  old_vendor: string | null;
  vendor: string | null;
  old_category: string | null;
  category: string | null;
  old_compare_at_price: string | null;
  compare_at_price: string | null;
  id: string;
  name: string;
  sku: string | null;
  old_description: string | null;
  description: string | null;
  image: string | null;
  kind: string;
  price: string | null;
  old_price: string | null;
  currency: string | null;
  old_currency: string | null;
  stock: number | null;
  old_stock: number | null;
  fields: string[];
};
export async function adminCatalogs() {
  const context = await adminContext("basic");
  const manifest = await getManifest();
  const summaries =
    context.source === "json" ? manifest : storefrontNavigation(manifest);
  const config = await getConfig();
  let counts = new Map<string, number>();
  if (context.active) {
    const links = summaries.map((c) => ({
      slug: c.slug,
      handles: [...new Set([c.slug, ...departmentHandles(c.slug)])],
    }));
    const { rows } = await database().query<{ slug: string; total: string }>(
      `SELECT c.slug,count(i.variant_id)::text AS total FROM jsonb_to_recordset($2::jsonb) AS c(slug text,handles text[]) LEFT JOIN catalog_items i ON i.import_id=$1 AND(c.slug='todos' OR i.collections&&c.handles) GROUP BY c.slug`,
      [context.active, JSON.stringify(links)],
    );
    counts = new Map(rows.map((r) => [r.slug, Number(r.total)]));
  }
  return {
    items: summaries.map((c) => ({ ...c, count: counts.get(c.slug) ?? null })),
    base: config.catalog.publicBaseUrl.replace(
      "pitterpanfestascatalogo.vercel.app",
      "catalogopitterpanfesta.vercel.app",
    ),
  };
}
