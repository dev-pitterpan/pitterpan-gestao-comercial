import test from "node:test";
import assert from "node:assert/strict";
import {
  workspaces,
  visibleWorkspaces,
  routineActive,
  routineHref,
  workspaceForRoute,
  searchRoutines,
} from "../src/shared/lib/admin/workspace-navigation.ts";
import { catalogDocumentClasses } from "../src/shared/lib/catalog/document-theme.ts";

test("navegação agrupa rotinas únicas, respeita perfis e mantém acesso aos módulos", () => {
  const items = workspaces.flatMap((module) => module.items);
  assert.equal(new Set(items.map((item) => item.href)).size, items.length);
  assert.deepEqual(
    visibleWorkspaces("gerente_compras")
      .flatMap((m) => m.items)
      .map((i) => i.href),
    visibleWorkspaces("gestor")
      .flatMap((m) => m.items)
      .map((i) => i.href),
  );
  const service = visibleWorkspaces("atendimento");
  assert.ok(service.length > 0);
  assert.ok(service.flatMap((m) => m.items).every((i) => !i.access));
  assert.equal(searchRoutines(service, "reembolsos").length, 0);
  assert.equal(searchRoutines(service, "equipe").length, 0);
  assert.ok(
    searchRoutines(visibleWorkspaces("admin"), "CONFIGURACOES").some(
      (i) => i.label === "Configurações",
    ),
  );
  assert.ok(
    searchRoutines(visibleWorkspaces("admin"), "recebimentos").length === 1,
  );
});
test("área e rotina ativa distinguem parâmetros de análises e reuniões", () => {
  const modules = visibleWorkspaces("admin");
  for (const href of [
    "/gestor/analises/",
    "/gestor/analises/?secao=vendas",
    "/gestor/analises/?secao=relatorios",
    "/gestor/analises/?secao=clientes",
    "/gestor/analises/checkouts/",
  ]) {
    const url = new URL(href, "https://fixture.test");
    const active = modules
      .flatMap((m) => m.items)
      .filter((i) => routineActive(i, url.pathname, url.searchParams));
    assert.equal(active.length, 1, href);
    assert.equal(
      workspaceForRoute(modules, url.pathname, url.searchParams).id,
      "analytics",
    );
  }
  assert.equal(
    workspaceForRoute(
      modules,
      "/gestor/reunioes/fixture/",
      new URLSearchParams(),
    ).id,
    "planning",
  );
  const item = modules
    .flatMap((m) => m.items)
    .find((i) => i.label === "Recebimentos")!;
  const url = new URL(
    routineHref(
      item,
      new URLSearchParams({
        start: "2026-11-01",
        end: "2026-11-24",
        status: "REFUNDS",
        cursor: "bad",
        delivery: "PICKUP",
      }),
    ),
    "https://fixture.test",
  );
  assert.equal(url.searchParams.get("start"), "2026-11-01");
  assert.equal(url.searchParams.has("status"), false);
  assert.equal(url.searchParams.has("cursor"), false);
  assert.equal(url.searchParams.has("delivery"), false);
});
test("navegação entre catálogo e gestão preserva a classe Geist e estados externos", () => {
  const original =
    "geist_variable accessibility-mode theme-natal client-page sidebar-is-open";
  const halloween = catalogDocumentClasses(original, [
    "theme-halloween",
    "quote-cart-open",
  ]);
  assert.match(halloween, /geist_variable/);
  assert.match(halloween, /accessibility-mode/);
  assert.doesNotMatch(halloween, /theme-natal|client-page|sidebar-is-open/);
  assert.equal(
    catalogDocumentClasses(halloween),
    "geist_variable accessibility-mode",
  );
});
