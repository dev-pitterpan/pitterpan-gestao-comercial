import { parseEnv } from "node:util";

const domain = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
const version = /^20\d{2}-(01|04|07|10)$/;
const passwordHash = /^scrypt[:$][a-f0-9]{32}[:$][a-f0-9]{128}$/;
export function prepareEnvironment(
  template: string,
  source: string,
  current: string,
  management: boolean,
) {
  const defaults = parseEnv(template),
    inherited = parseEnv(source),
    existing = parseEnv(current);
  const values: Record<string, string> = {};
  for (const key of Object.keys(defaults)) {
    const localOnly = [
      "HOST",
      "PORT",
      "NEXT_PUBLIC_CATALOG_URL",
      "NEXT_TELEMETRY_DISABLED",
    ].includes(key);
    values[key] =
      existing[key] ||
      (!localOnly ? inherited[key] : "") ||
      defaults[key] ||
      "";
  }
  if (!existing.PORT) values.PORT = management ? "3001" : "3000";
  if (!existing.NEXT_PUBLIC_CATALOG_URL)
    values.NEXT_PUBLIC_CATALOG_URL = "http://127.0.0.1:3000";
  const productAccess =
    !!values.SHOPIFY_ADMIN_ACCESS_TOKEN ||
    !!(values.SHOPIFY_CLIENT_ID && values.SHOPIFY_CLIENT_SECRET);
  if (
    !existing.CATALOG_DATA_SOURCE &&
    inherited.CATALOG_DATA_SOURCE !== "postgres" &&
    productAccess
  )
    values.CATALOG_DATA_SOURCE = "shopify";
  if (management && passwordHash.test(values.ADMIN_PASSWORD_HASH || ""))
    values.ADMIN_PASSWORD_HASH = values.ADMIN_PASSWORD_HASH.replaceAll(
      "$",
      ":",
    );
  const issues: string[] = [];
  if (!["json", "shopify", "postgres"].includes(values.CATALOG_DATA_SOURCE))
    issues.push("CATALOG_DATA_SOURCE inválida");
  if (!domain.test(values.SHOPIFY_STORE_DOMAIN || ""))
    issues.push("SHOPIFY_STORE_DOMAIN ausente ou inválida");
  if (!version.test(values.SHOPIFY_API_VERSION || ""))
    issues.push("SHOPIFY_API_VERSION inválida");
  if (!productAccess)
    issues.push(
      "Configure SHOPIFY_ADMIN_ACCESS_TOKEN ou o par SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET",
    );
  if (values.CATALOG_DATA_SOURCE === "json")
    issues.push(
      "CATALOG_DATA_SOURCE=json usa dados locais; para consultar a Shopify, use shopify ou postgres sincronizado",
    );
  if (values.CATALOG_DATA_SOURCE === "postgres" || management) {
    try {
      if (
        !["postgres:", "postgresql:"].includes(
          new URL(values.DATABASE_URL).protocol,
        )
      )
        throw new Error();
    } catch {
      issues.push("DATABASE_URL ausente ou inválida");
    }
  }
  if (management) {
    if (!domain.test(values.SHOPIFY_SALES_STORE_DOMAIN || ""))
      issues.push("SHOPIFY_SALES_STORE_DOMAIN ausente ou inválida");
    for (const key of [
      "SHOPIFY_SALES_CLIENT_ID",
      "SHOPIFY_SALES_CLIENT_SECRET",
    ])
      if (!values[key]) issues.push(`${key} ausente`);
    if (!version.test(values.SHOPIFY_SALES_API_VERSION || ""))
      issues.push("SHOPIFY_SALES_API_VERSION inválida");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.ADMIN_EMAIL || ""))
      issues.push("ADMIN_EMAIL ausente ou inválido");
    if (!passwordHash.test(values.ADMIN_PASSWORD_HASH || ""))
      issues.push("ADMIN_PASSWORD_HASH ausente ou inválido");
    if ((values.ADMIN_SESSION_SECRET?.length || 0) < 32)
      issues.push("ADMIN_SESSION_SECRET precisa de pelo menos 32 caracteres");
    if (values.CRON_SECRET && values.CRON_SECRET.length < 32)
      issues.push("CRON_SECRET precisa de pelo menos 32 caracteres");
    if (values.JITSI_BASE_URL) {
      try {
        const url = new URL(values.JITSI_BASE_URL);
        if (
          url.protocol !== "https:" ||
          url.username ||
          url.password ||
          url.pathname !== "/" ||
          url.search ||
          url.hash
        )
          throw new Error();
      } catch {
        issues.push("JITSI_BASE_URL deve ser uma origem HTTPS válida");
      }
    }
  }
  try {
    const url = new URL(values.NEXT_PUBLIC_CATALOG_URL);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error();
  } catch {
    issues.push("NEXT_PUBLIC_CATALOG_URL inválida");
  }
  // A lista permitida vem do modelo de cada aplicação. Nunca copia variáveis extras.
  const content = template
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
      return match ? `${match[1]}=${JSON.stringify(values[match[1]])}` : line;
    })
    .join("\n");
  return {
    content,
    issues,
    source: values.CATALOG_DATA_SOURCE,
    port: values.PORT,
  };
}
