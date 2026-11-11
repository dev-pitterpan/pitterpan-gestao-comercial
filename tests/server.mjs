import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import {
  hashPassword,
  signSession,
  credentialVersion,
} from "../src/shared/server/auth/crypto.ts";

const passwordHash = await hashPassword("fixture-password-for-isolation");
const secret = randomBytes(48).toString("hex");
const user = {
  sub: "bootstrap",
  email: "admin@example.test",
  name: "Teste",
  role: "admin",
  version: credentialVersion(passwordHash, secret),
};
const cookie = `__Host-pitterpan-session=${signSession(user, secret)}`;
for (const [application, port] of [["gestao-comercial", "3189"]]) {
  const child = spawn(process.execPath, ["scripts/run-next.ts", "start"], {
    env: {
      ...process.env,
      PORT: port,
      CATALOG_DATA_SOURCE: "json",
      DATABASE_URL: "",
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_CATALOG_URL: "http://127.0.0.1:3000",
      ADMIN_EMAIL: user.email,
      ADMIN_NAME: user.name,
      ADMIN_PASSWORD_HASH: passwordHash,
      ADMIN_SESSION_SECRET: secret,
      SHOPIFY_SALES_STORE_DOMAIN: "fixture.myshopify.com",
      SHOPIFY_SALES_CLIENT_ID: "fixture",
      SHOPIFY_SALES_CLIENT_SECRET: "fixture-secret",
      JITSI_BASE_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stderr.on("data", (chunk) => {
    logs += chunk;
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Servidor não iniciou: ${logs}`)),
        30_000,
      );
      child.stdout.on("data", (chunk) => {
        if (/ready/i.test(String(chunk))) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Servidor encerrou (${code}): ${logs}`));
      });
    });
    const base = `http://127.0.0.1:${port}`;
    const get = (path, options = {}) =>
      fetch(base + path, { redirect: "manual", ...options });
    assert.equal((await get("/api/health/")).status, 200);
    const catalogResponse = await get("/api/catalogs/natal/");
    assert.equal(catalogResponse.status, 200);
    const { catalog } = await catalogResponse.json();
    assert.ok(catalog.products.length);
    assert.ok(
      catalog.products.every((product) => !("inventoryQuantity" in product)),
    );
    assert.equal(
      (await get("/assets/images/brand/pitter-pan-logo.svg")).status,
      200,
    );
    assert.equal(
      (
        await get("/api/cart/", {
          method: "POST",
          body: JSON.stringify({ ids: [] }),
          headers: { "Content-Type": "application/json" },
        })
      ).status,
      200,
    );
    if (application === "catalogo-digital") {
      assert.equal((await get("/")).status, 200);
      assert.equal((await get("/natal/")).status, 200);
      for (const path of [
        "/api/admin/sales/",
        "/api/auth/login/",
        "/api/cron/sales/",
        "/api/webhooks/shopify/sales/",
      ]) {
        assert.equal(
          (await get(path)).status,
          404,
          `Rota privada presente no catálogo: ${path}`,
        );
      }
      assert.equal((await get("/gestor/vendas/")).status, 404);
    } else {
      const home = await get("/");
      assert.equal(home.status, 307);
      assert.equal(home.headers.get("location"), "/gestor/");
      const guarded = await get("/gestor/vendas/");
      assert.equal(guarded.status, 307);
      assert.match(guarded.headers.get("location"), /^\/login/);
      assert.equal((await get("/api/admin/sales/")).status, 401);
      assert.equal((await get("/login/")).status, 200);
      assert.equal((await get("/gestor/versoes/")).status, 307);
      for (const path of [
        "/gestor/",
        "/gestor/vendas/",
        "/gestor/vendas/recebimentos/",
        "/gestor/analises/",
        "/gestor/produtos/",
        "/gestor/natal/",
        "/gestor/versoes/",
      ]) {
        const response = await get(path, { headers: { cookie } });
        assert.equal(
          response.status,
          200,
          `Prévia protegida indisponível: ${path}`,
        );
        assert.match(response.headers.get("cache-control"), /no-store/);
        assert.match(response.headers.get("x-robots-tag"), /noindex/);
        const html = await response.text();
        assert.doesNotMatch(html, /class="party-section-scene/);
        if (path === "/gestor/versoes/") {
          assert.match(html, /Versões e atualizações/);
          assert.match(html, /docs\/SISTEMA\.md/);
        }
        if (path === "/gestor/")
          assert.match(html, /href="http:\/\/127\.0\.0\.1:3000\/"/);
        if (path === "/gestor/vendas/recebimentos/")
          assert.match(
            html,
            /<header class="admin-page-heading">.*?<h1>Recebimentos<\/h1>.*?Período dos pedidos.*?Modalidade de entrega.*?<\/header>/s,
          );
        if (path === "/gestor/analises/")
          assert.match(
            html,
            /<header class="admin-page-heading">.*?<h1>Visão geral da loja<\/h1>.*?Período das análises.*?<\/header>/s,
          );
        if (path === "/gestor/produtos/") {
          assert.match(
            html,
            /<header class="admin-page-heading">.*?<h1>Produtos<\/h1>.*?Buscar por nome, SKU ou marca.*?<\/header>/s,
          );
          assert.match(
            html,
            /class="admin-table-scroll finance-table-viewport drag-scroll"/,
          );
          assert.match(
            html,
            /<nav class="admin-table-pagination" aria-label="Páginas de produtos"/,
          );
        }
      }
      const productPage = await get("/gestor/produtos/?q=a&page=2", {
        headers: { cookie },
      });
      assert.equal(productPage.status, 200);
      const productHtml = await productPage.text();
      const pager = productHtml.match(
        /<nav class="admin-table-pagination"[^>]*>.*?<\/nav>/s,
      )?.[0];
      assert.ok(pager);
      assert.match(pager, /21–40 de [\d.]+ produtos/);
      assert.match(pager, /Página <!-- -->2/);
      assert.match(
        pager,
        /aria-label="Página anterior" href="[^"]*q=a&amp;[^"]*page=1"/,
      );
      assert.match(
        pager,
        /aria-label="Próxima página" href="[^"]*q=a&amp;[^"]*page=3"/,
      );
    }
    console.log(
      `${application}: rotas, recursos compartilhados e isolamento HTTP OK.`,
    );
  } finally {
    child.kill("SIGTERM");
    if (child.exitCode === null) await once(child, "exit");
  }
}
