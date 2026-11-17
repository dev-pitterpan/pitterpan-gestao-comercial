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

export async function findFiscalOrders(query: string) {
  const { rows } = await database().query<{
    id: string;
    name: string;
    customer_name: string | null;
    currency: string;
    total: string;
  }>(
    `SELECT id, name, ${customerNameColumn}, currency, COALESCE(current_total,total) AS total
      FROM pitterpan_sales_orders o
      WHERE store=$1 AND NOT test
        AND (id=$2 OR lower(ltrim(name, '#'))=lower(ltrim($2, '#')))
      ORDER BY processed_at DESC, id LIMIT 20`,
    [storeDomain(), query],
  );
  return rows;
}

export async function listInvoices(orderId?: string) {
  const { rows } = await database().query<{
    order_id: string;
    name: string;
    access_key: string;
    invoice_number: number;
    series: number;
    imported_at: Date;
  }>(
    `SELECT i.order_id, o.name, i.access_key, i.invoice_number, i.series, i.imported_at
      FROM pitterpan_sales_invoices i
      JOIN pitterpan_sales_orders o ON o.store=i.store AND o.id=i.order_id
      WHERE i.store=$1 AND ($2::text IS NULL OR i.order_id=$2)
      ORDER BY i.imported_at DESC, i.access_key DESC LIMIT 30`,
    [storeDomain(), orderId ?? null],
  );
  return rows;
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
