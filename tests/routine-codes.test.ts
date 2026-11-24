import test from "node:test";
import assert from "node:assert/strict";
import {
  workspaces,
  visibleWorkspaces,
  activeRoutine,
  searchRoutines,
} from "../src/shared/lib/admin/workspace-navigation.ts";

test("rotinas têm códigos permanentes únicos, por módulo e independentes da ordem de exibição", () => {
  const prefixes: Record<string, string> = {
    overview: "1",
    sales: "2",
    catalog: "3",
    inventory: "4",
    planning: "5",
    analytics: "6",
    system: "7",
  };
  const items = workspaces.flatMap((module) => module.items);
  assert.equal(new Set(items.map((item) => item.code)).size, items.length);
  for (const module of workspaces)
    for (const item of module.items) {
      assert.match(item.code, /^[1-7]\d{3}$/);
      assert.equal(item.code[0], prefixes[module.id]);
    }
  for (const [href, code] of [
    ["/gestor/", "1001"],
    ["/gestor/vendas/", "2002"],
    ["/gestor/produtos/", "3001"],
    ["/gestor/ofertas/", "3002"],
    ["/gestor/produtos-vendidos/", "3003"],
    ["/gestor/estoque/", "4001"],
    ["/gestor/agenda/", "5001"],
    ["/gestor/usuarios/", "7002"],
  ])
    assert.equal(items.find((item) => item.href === href)?.code, code);
  for (const role of [
    "admin",
    "gestor",
    "gerente_compras",
    "atendimento",
  ] as const)
    for (const item of visibleWorkspaces(role).flatMap(
      (module) => module.items,
    ))
      assert.equal(
        item.code,
        items.find((original) => original.href === item.href)?.code,
      );
});
test("busca por código, prefixo, nome ou combinação preserva as permissões", () => {
  const admin = visibleWorkspaces("admin"),
    service = visibleWorkspaces("atendimento");
  for (const query of [
    "3002",
    "#3002",
    "Rotina 3002",
    "rotina #3002",
    "3002 ofertas",
  ]) {
    const result = searchRoutines(admin, query);
    assert.equal(result.length, 1, query);
    assert.equal(result[0].href, "/gestor/ofertas/");
  }
  assert.equal(searchRoutines(admin, "30").length, 6);
  assert.equal(searchRoutines(admin, "2").length, 8);
  assert.equal(searchRoutines(admin, "002").length, 0);
  assert.equal(searchRoutines(admin, "3001 ofertas").length, 0);
  assert.equal(searchRoutines(admin, "9999").length, 0);
  assert.equal(searchRoutines(service, "3003").length, 0);
  assert.equal(searchRoutines(service, "7002").length, 0);
  assert.equal(searchRoutines(service, "3004")[0]?.code, "3004");
  assert.equal(searchRoutines(admin, "CONFIGURACOES")[0]?.code, "7003");
});
test("identificação da página segue a rotina correta em análises, detalhes e perfis", () => {
  const modules = visibleWorkspaces("admin");
  for (const [route, code] of [
    ["/gestor/analises/", "6001"],
    ["/gestor/analises/?secao=vendas", "6002"],
    ["/gestor/analises/?secao=clientes", "6004"],
    ["/gestor/analises/?relatorio=sales-time", "6006"],
    ["/gestor/reunioes/fixture/", "5001"],
    ["/gestor/mapa/?country=BR", "2007"],
  ]) {
    const url = new URL(route, "https://example.test");
    assert.equal(
      activeRoutine(modules, url.pathname, url.searchParams)?.code,
      code,
    );
  }
  assert.equal(
    activeRoutine(
      visibleWorkspaces("atendimento"),
      "/gestor/usuarios/",
      new URLSearchParams(),
    ),
    undefined,
  );
});
