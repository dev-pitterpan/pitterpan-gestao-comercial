import { database } from "../database/client";
import { customerNameColumn } from "../sales/customers";
import { readAuthorizedNfe } from "./nfe";

export const fiscalRoles = ["admin", "gestor"] as const;
export const orderIdPattern = /^gid:\/\/shopify\/Order\/[0-9]{1,30}$/;
export const fiscalPath = "/gestor/notas-fiscais/";

function storeDomain() {
  const store = process.env.SHOPIFY_SALES_STORE_DOMAIN;
  if (!store || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(store))
    throw new Error("Configure a loja de vendas para consultar notas fiscais.");
  return store;
}

export const fiscalPageSize = 8;

export async function listFiscalOrders(query: string, page: number) {
  const { rows } = await database().query<{
    id: string;
    name: string;
    customer_name: string | null;
    processed_at: Date;
    currency: string;
    total: string;
    notes: number;
    printable_key: string | null;
  }>(
    `SELECT o.id, o.name, o.processed_at, o.currency, ${customerNameColumn},
          COALESCE(o.current_total,o.total) AS total,
          n.notes, n.printable_key
      FROM (
        SELECT * FROM pitterpan_sales_orders
        WHERE store=$1 AND NOT test
          AND ($2='' OR id=$2 OR lower(ltrim(name, '#'))=lower(ltrim($2, '#')))
        ORDER BY processed_at DESC,id DESC
        LIMIT $3 OFFSET $4
      ) o
      CROSS JOIN LATERAL (
        SELECT count(*)::int AS notes, min(access_key) FILTER (WHERE danfe_pdf IS NOT NULL) AS printable_key
        FROM pitterpan_sales_invoices WHERE store=o.store AND order_id=o.id
      ) n
      ORDER BY o.processed_at DESC,o.id DESC`,
    [storeDomain(), query, fiscalPageSize + 1, (page - 1) * fiscalPageSize],
  );
  return {
    orders: rows.slice(0, fiscalPageSize),
    hasNext: rows.length > fiscalPageSize,
  };
}

export async function listInvoices(orderId: string) {
  const { rows } = await database().query<{
    access_key: string;
    invoice_number: number;
    series: number;
    has_danfe: boolean;
  }>(
    `SELECT access_key, invoice_number, series, danfe_pdf IS NOT NULL AS has_danfe
      FROM pitterpan_sales_invoices WHERE store=$1 AND order_id=$2
      ORDER BY imported_at DESC, access_key DESC`,
    [storeDomain(), orderId],
  );
  return rows;
}

export async function attachDanfePdf(
  orderId: string,
  key: string,
  pdf: Buffer,
  actor: string,
) {
  const result = await database().query(
    `UPDATE pitterpan_sales_invoices SET danfe_pdf=$4, danfe_imported_by=$5, danfe_imported_at=now()
      WHERE store=$1 AND order_id=$2 AND access_key=$3 AND danfe_pdf IS NULL`,
    [storeDomain(), orderId, key, pdf, actor],
  );
  return result.rowCount === 1;
}

export async function downloadDanfe(key: string) {
  const { rows } = await database().query<{ danfe_pdf: Buffer | null }>(
    "SELECT danfe_pdf FROM pitterpan_sales_invoices WHERE store=$1 AND access_key=$2",
    [storeDomain(), key],
  );
  return rows[0]?.danfe_pdf;
}

export async function importInvoice(
  orderId: string,
  xml: Buffer,
  actor: string,
) {
  const invoice = readAuthorizedNfe(xml);
  const result = await database().query(
    `INSERT INTO pitterpan_sales_invoices(store, order_id, access_key, authorization_protocol, invoice_number, series, xml, imported_by)
      SELECT o.store, o.id, $3, $4, $5, $6, $7, $8
      FROM pitterpan_sales_orders o WHERE o.store=$1 AND o.id=$2 AND NOT o.test
      ON CONFLICT (store, access_key) DO NOTHING`,
    [
      storeDomain(),
      orderId,
      invoice.key,
      invoice.authorization,
      invoice.number,
      invoice.series,
      xml,
      actor,
    ],
  );
  return result.rowCount === 1;
}

export async function downloadInvoice(key: string) {
  const { rows } = await database().query<{ xml: Buffer }>(
    "SELECT xml FROM pitterpan_sales_invoices WHERE store=$1 AND access_key=$2",
    [storeDomain(), key],
  );
  return rows[0]?.xml;
}
