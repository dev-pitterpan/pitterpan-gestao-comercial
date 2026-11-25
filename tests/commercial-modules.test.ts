import test from "node:test";
import assert from "node:assert/strict";
import {
  commercialMenu,
  commercialModule,
  commercialModuleLink,
} from "../src/shared/lib/admin/commercial-modules.ts";
import {
  visibleWorkspaces,
  searchRoutines,
  activeRoutine,
} from "../src/shared/lib/admin/workspace-navigation.ts";
import { contentCategories } from "../src/shared/lib/admin/content-categories.ts";

test("módulos comerciais agrupam o menu sem aposentar rotinas ou alterar permissões", () => {
  const modules = visibleWorkspaces("admin");
  const sales = modules.find((item) => item.id === "sales")!;
  const menu = commercialMenu(sales.items);
  assert.deepEqual(
    menu.filter((item) => !item.planned).map((item) => item.label),
    ["Visão geral", "Pedidos", "Financeiro", "Clientes", "Entregas"],
  );
  for (const [path, code, group] of [
    ["/gestor/vendas/atendimento/", "2003", "orders"],
    ["/gestor/vendas/reembolsos/", "2005", "finance"],
  ]) {
    assert.equal(commercialModule(path)?.id, group);
    assert.equal(
      activeRoutine(modules, path, new URLSearchParams())?.code,
      code,
    );
  }
  assert.equal(
    searchRoutines(modules, "2005")[0].label,
    "Estornos e reembolsos",
  );
  assert.equal(
    visibleWorkspaces("atendimento").some((item) => item.id === "sales"),
    false,
  );
});
test("opções internas mantêm contexto e não transportam status financeiro ou cursores", () => {
  const params = new URLSearchParams({
    start: "2026-11-01",
    end: "2026-11-25",
    category: "balões",
    delivery: "SEDEX",
    fulfillment: "AWAITING",
    status: "CASH_FLOW",
    metric: "net",
    cursor: "bad",
    page: "8",
  });
  const target = new URL(
    commercialModuleLink("/gestor/vendas/reembolsos/", params),
    "https://fixture.test",
  );
  for (const key of ["start", "end", "category", "delivery"])
    assert.equal(target.searchParams.get(key), params.get(key));
  for (const key of ["status", "fulfillment", "metric", "cursor", "page"])
    assert.equal(target.searchParams.has(key), false);
  const orders = contentCategories(
    "/gestor/vendas/",
    new URLSearchParams({ ...Object.fromEntries(params), status: "PAID" }),
    "admin",
  );
  assert.deepEqual(
    orders.map((item) => item.code),
    ["2002", "2003"],
  );
  for (const item of orders) {
    const url = new URL(item.href, "https://fixture.test");
    assert.equal(url.searchParams.get("status"), "PAID");
    assert.equal(url.searchParams.get("delivery"), "SEDEX");
  }
  for (const path of [
    "/gestor/vendas/resumo/",
    "/gestor/clientes/",
    "/gestor/mapa/",
  ])
    assert.equal(contentCategories(path, params, "admin").length, 1);
});
