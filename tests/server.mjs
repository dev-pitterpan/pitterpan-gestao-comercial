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
      const removedVersions = await get("/gestor/versoes/", {
        headers: { cookie },
      });
      assert.match(await removedVersions.text(), /Página não encontrada/);
      for (const path of [
        "/gestor/",
        "/gestor/vendas/",
        "/gestor/vendas/recebimentos/",
        "/gestor/vendas/reembolsos/",
        "/gestor/vendas/atendimento/",
        "/gestor/vendas/resumo/",
        "/gestor/analises/",
        "/gestor/produtos/",
        "/gestor/clientes/",
        "/gestor/mapa/",
        "/gestor/natal/",
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
        if (path !== "/gestor/natal/") {
          assert.match(html, /id="workspace-navigation"/);
          assert.match(html, /aria-label="Áreas da gestão"/);
          assert.match(html, /aria-label="Buscar rotina na gestão"/);
          assert.doesNotMatch(html, /class="admin-sidebar"/);
          const code = {
            "/gestor/": "1001",
            "/gestor/vendas/": "2002",
            "/gestor/vendas/recebimentos/": "2004",
            "/gestor/analises/": "6001",
            "/gestor/produtos/": "3001",
            "/gestor/clientes/": "2006",
            "/gestor/mapa/": "2007",
          }[path];
          if (code) {
            assert.match(
              html,
              new RegExp(`class="workspace-header-code"[^>]*>${code}<`),
            );
            assert.match(
              html,
              new RegExp(
                `class="admin-routine-identifier"[^>]*>Rotina <b>${code}</b>`,
              ),
            );
          }
          assert.match(html, /class="workspace-routine-code"/);
        }
        if (path.startsWith("/gestor/vendas/")) {
          assert.match(html, /Rotina 2002: Pedidos/);
          assert.match(html, /Rotina 2004: Financeiro/);
          assert.doesNotMatch(
            html,
            /aria-label="Rotina 2003:|aria-label="Rotina 2005:/,
          );
        }
        if (path === "/gestor/vendas/resumo/") {
          assert.match(html, /<h1>Visão geral comercial<\/h1>/);
          assert.match(html, /class="workspace-query-fallback"/);
          assert.doesNotMatch(html, /aria-label="Opções do módulo"/);
        }
        if (path === "/gestor/mapa/") {
          assert.match(html, /<h1>Mapa de entregas<\/h1>/);
          assert.doesNotMatch(html, /aria-label="Opções do módulo"/);
          assert.match(html, /Estado de destino/);
          assert.match(html, /aria-label="Filtros de destinos"/);
          assert.doesNotMatch(html, /Refinar consulta|delivery-advanced/);
          assert.match(html, /aria-label="Categorias das entregas"/);
          assert.match(html, /class="delivery-world-card"/);
          assert.match(html, /class="delivery-map-canvas"/);
          assert.doesNotMatch(html, /Mapa de cidades/);
          assert.doesNotMatch(html, /Mapa pontilhado do Brasil/);
        }
        if (
          [
            "/gestor/produtos/",
            "/gestor/ofertas/",
            "/gestor/catalogos/",
          ].includes(path)
        ) {
          assert.doesNotMatch(html, /aria-label="Categorias desta área"/);
          assert.doesNotMatch(
            html,
            /workspace-routine-controls|workspace-filter-dialog/,
          );
          assert.equal(
            (html.match(/aria-label="Sair da conta"/g) || []).length,
            1,
          );
        }
        if (path === "/gestor/produtos/") {
          assert.match(html, /class="header-filter-category"/);
          assert.equal((html.match(/name="q"/g) || []).length, 1);
          assert.doesNotMatch(html, /Refine a seleção|Filtros da consulta/);
        }
        if (path === "/gestor/clientes/") {
          assert.match(html, /<h1>Ranking de clientes<\/h1>/);
          assert.match(html, /Ordenar clientes/);
        }
        if (path === "/gestor/") {
          assert.doesNotMatch(html, /class="workspace-header-actions"/);
          assert.doesNotMatch(html, /href="\/gestor\/versoes\/"/);
        }
        if (
          [
            "/gestor/vendas/",
            "/gestor/vendas/atendimento/",
            "/gestor/vendas/recebimentos/",
          ].includes(path)
        ) {
          assert.doesNotMatch(html, /class="routine-query-toggle"/);
          assert.match(html, /id="workspace-header-query"/);
          assert.match(html, /class="workspace-query-fallback"/);
          assert.doesNotMatch(html, /class="workspace-header-actions"/);
          assert.match(
            html,
            /class="workspace-query-group" aria-label="Filtros de vendas"/,
          );
          assert.match(
            html,
            /aria-label="Filtros de vendas".*?class="content-navigation-row".*?<nav[^>]*aria-label="Opções do módulo".*?<\/nav>.*?class="content-navigation-action".*?class="admin-date-range"/s,
          );
          assert.doesNotMatch(
            html,
            /Escolha uma opção\. Os resultados atualizam automaticamente\./,
          );
        }
        if (path === "/gestor/vendas/") {
          assert.match(html, /aria-label="Opções do módulo"/);
          assert.match(html, /<h1>Pedidos<\/h1>/);
          assert.match(html, /aria-label="Filtros de vendas"/);
          assert.doesNotMatch(
            html,
            /Refinar consulta|content-filter-workspace|recent-orders-status/,
          );
          for (const id of [
            "sales-status",
            "sales-fulfillment",
            "sales-delivery-filter",
            "sales-category",
          ]) {
            assert.equal(
              (html.match(new RegExp(`id="${id}"`, "g")) || []).length,
              1,
            );
          }
        }
        if (path === "/gestor/vendas/recebimentos/") {
          assert.match(
            html,
            /workspace-query-fallback.*?<h1>Financeiro<\/h1>.*?content-navigation-action.*?Período dos pedidos/s,
          );
          assert.match(html, /id="sales-delivery-filter"/);
          assert.match(html, /id="sales-category"/);
          assert.doesNotMatch(html, /id="sales-status"|id="sales-fulfillment"/);
        }
        if (path === "/gestor/analises/")
          assert.match(
            html,
            /<header class="admin-page-heading">.*?<h1>Visão geral da loja<\/h1>.*?<\/header>.*?class="workspace-query-fallback".*?class="admin-date-range"/s,
          );
        if (path === "/gestor/produtos/") {
          assert.match(
            html,
            /<header class="admin-page-heading">.*?<h1>Produtos<\/h1>.*?<\/header>.*?class="header-filter-category".*?Filtrar categoria.*?Filtrar marca/s,
          );
          assert.match(
            html,
            /class="admin-table-scroll finance-table-viewport admin-product-viewport drag-scroll"/,
          );
          assert.match(
            html,
            /<th scope="col">.*?<span>Produto<\/span>.*?aria-label="Buscar produto por nome ou SKU".*?<\/th>/s,
          );
          assert.doesNotMatch(html, /class="admin-global-search"/);
          assert.match(
            html,
            /<nav class="admin-table-pagination" aria-label="Páginas de produtos"/,
          );
        }
      }
      const filteredSummary = await get(
        "/gestor/vendas/resumo/?category=baloes&status=PAID",
        { headers: { cookie } },
      );
      assert.equal(filteredSummary.status, 200);
      const filteredSummaryHtml = await filteredSummary.text();
      assert.match(filteredSummaryHtml, /aria-label="Filtros de vendas"/);
      assert.match(
        filteredSummaryHtml,
        /<input(?=[^>]*id="sales-category")(?=[^>]*type="search")(?=[^>]*value="baloes")[^>]*>/,
      );
      assert.match(filteredSummaryHtml, /title="Situação do pagamento: Pagos"/);
      const scopedFinance = await get(
        "/gestor/vendas/recebimentos/?fulfillment=AWAITING&category=baloes",
        { headers: { cookie } },
      );
      assert.equal(scopedFinance.status, 200);
      const scopedFinanceHtml = await scopedFinance.text();
      assert.match(
        scopedFinanceHtml,
        /<input(?=[^>]*id="sales-category")(?=[^>]*type="search")(?=[^>]*value="baloes")[^>]*>/,
      );
      assert.doesNotMatch(scopedFinanceHtml, /id="sales-fulfillment"/);
      for (const section of ["desempenho", "catalogo", "prioridades"]) {
        const response = await get(`/gestor/?secao=${section}`, {
          headers: { cookie },
        });
        assert.equal(response.status, 200);
        const html = await response.text();
        assert.match(html, new RegExp(`content-overview--${section}`));
        assert.match(html, /aria-label="Seções da visão geral"/);
        if (section === "catalogo") {
          assert.match(html, /<section[^>]*class="workspace-catalog-metrics"/);
          assert.doesNotMatch(html, /class="workspace-trend-card"/);
          assert.doesNotMatch(html, /class="priority-queue"/);
        } else if (section === "prioridades") {
          assert.match(html, /class="priority-queue"/);
          assert.match(html, /Central de prioridades/);
          assert.match(html, /aria-label="Categorias da fila de prioridades"/);
          assert.doesNotMatch(html, /class="workspace-queue-card"/);
          assert.doesNotMatch(html, /id="overview-pending"/);
          assert.doesNotMatch(html, /class="workspace-trend-card"/);
          assert.doesNotMatch(
            html,
            /<section[^>]*class="workspace-catalog-metrics"/,
          );
        } else {
          assert.match(html, /aria-label="Desempenho comercial em bento"/);
          assert.doesNotMatch(html, /class="workspace-trend-card"/);
          assert.doesNotMatch(html, /class="priority-queue"/);
          assert.doesNotMatch(
            html,
            /<section[^>]*class="workspace-catalog-metrics"/,
          );
        }
      }
      for (const view of ["cities", "destinations"]) {
        const response = await get(`/gestor/mapa/?painel=${view}`, {
          headers: { cookie },
        });
        assert.equal(response.status, 200);
        const html = await response.text();
        if (view === "cities") {
          // Old bookmarks now open the single interactive dark map.
          assert.match(html, /class="delivery-world-card"/);
          assert.equal(
            (html.match(/class="delivery-map-canvas"/g) || []).length,
            1,
          );
        } else {
          assert.doesNotMatch(html, /class="delivery-world-card"/);
          assert.match(html, /class="delivery-detail-card"/);
        }
        assert.doesNotMatch(html, /class="delivery-city-map-card"/);
      }
      const offersPage = await get("/gestor/ofertas/", { headers: { cookie } });
      assert.equal(offersPage.status, 200);
      const offersHtml = await offersPage.text();
      assert.match(offersHtml, /class="admin-products-orderbar"/);
      assert.match(offersHtml, /aria-label="Ordenar ofertas"/);
      assert.match(
        offersHtml,
        /<input(?=[^>]*checked="")(?=[^>]*name="sort")(?=[^>]*value="updated_desc")[^>]*>/,
      );
      assert.equal((offersHtml.match(/name="sort"/g) || []).length, 3);
      const alphabeticalOffers = await get("/gestor/ofertas/?sort=name_asc", {
        headers: { cookie },
      });
      assert.match(
        await alphabeticalOffers.text(),
        /<input(?=[^>]*checked="")(?=[^>]*name="sort")(?=[^>]*value="name_asc")[^>]*>/,
      );
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
