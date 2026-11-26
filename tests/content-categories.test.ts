import test from "node:test";
import assert from "node:assert/strict";
import {
  contentCategories,
  overviewHref,
  overviewSection,
} from "../src/shared/lib/admin/content-categories.ts";

test("visão geral escolhe uma única categoria e atendimento nunca recebe a área financeira", () => {
  for (const section of ["desempenho", "catalogo", "prioridades"] as const)
    assert.equal(overviewSection(section, "admin"), section);
  assert.equal(overviewSection("desconhecido", "gestor"), "desempenho");
  assert.equal(overviewSection(["prioridades"], "admin"), "desempenho");
  assert.equal(overviewSection("desempenho", "atendimento"), "catalogo");
  assert.equal(overviewSection("prioridades", "atendimento"), "catalogo");
  const href = new URL(
    overviewHref(
      "catalogo",
      new URLSearchParams({
        start: "2026-11-01",
        end: "2026-11-24",
        page: "5",
        status: "PAID",
        secao: "prioridades",
      }),
    ),
    "https://example.test",
  );
  assert.equal(href.searchParams.get("secao"), "catalogo");
  assert.equal(href.searchParams.get("start"), "2026-11-01");
  assert.equal(href.searchParams.has("page"), false);
  assert.equal(href.hash, "");
  assert.equal(href.searchParams.has("status"), false);
});
test("categorias comerciais preservam o período e não transportam status financeiro implícito entre rotinas", () => {
  const params = new URLSearchParams({
    start: "2026-11-01",
    end: "2026-11-24",
    status: "CASH_FLOW",
    category: "balões",
    cursor: "old",
    page: "3",
  });
  const categories = contentCategories(
    "/gestor/vendas/recebimentos/",
    params,
    "admin",
  );
  assert.equal(categories.filter((item) => item.active).length, 1);
  assert.ok(
    categories.every(
      (item) => !item.href.includes("cursor") && !item.href.includes("page="),
    ),
  );
  assert.deepEqual(
    categories.map((item) => item.code),
    ["2004", "2005"],
  );
  const refunds = categories.find((item) => item.code === "2005")!;
  const destination = new URL(refunds.href, "https://example.test");
  assert.equal(destination.searchParams.get("start"), "2026-11-01");
  assert.equal(destination.searchParams.has("status"), false);
  assert.equal(destination.searchParams.get("category"), "balões");
  assert.equal(
    contentCategories("/gestor/vendas/", params, "atendimento").length,
    0,
  );
});
test("catálogo e sistema usam a sidebar sem duplicar rotinas no conteúdo", () => {
  for (const role of ["admin", "gestor", "atendimento"] as const) {
    for (const path of [
      "/gestor/produtos/",
      "/gestor/ofertas/",
      "/gestor/catalogos/",
      "/gestor/catalogos/imagens/",
      "/gestor/estoque/",
      "/gestor/alteracoes/",
      "/gestor/sincronizacoes/",
      "/gestor/usuarios/",
      "/gestor/configuracoes/",
      "/gestor/minha-conta/",
    ]) {
      assert.deepEqual(
        contentCategories(
          path,
          new URLSearchParams({ q: "bolo", vendor: "BWB", page: "8" }),
          role,
        ),
        [],
        `${role}: ${path}`,
      );
    }
  }
});
test("análises mantêm uma única categoria selecionada para cada relatório ou visão", () => {
  for (const query of [
    "",
    "secao=vendas",
    "secao=clientes",
    "secao=atribuicao",
    "secao=relatorios",
    "relatorio=sales-time",
  ]) {
    const categories = contentCategories(
      "/gestor/analises/",
      new URLSearchParams(query),
      "admin",
    );
    assert.equal(categories.filter((item) => item.active).length, 1, query);
    assert.ok(
      categories.every((item) => item.href.includes("/gestor/analises/")),
    );
  }
  const categories = contentCategories(
    "/gestor/analises/checkouts/",
    new URLSearchParams(),
    "gestor",
  );
  assert.equal(categories.filter((item) => item.active).length, 1);
});
