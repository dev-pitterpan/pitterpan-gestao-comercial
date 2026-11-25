import test from "node:test";
import assert from "node:assert/strict";
import {
  chartNumber,
  chartDomain,
  distribution,
  shareableMetric,
} from "../src/shared/lib/admin/infographic.ts";
test("escala dos infográficos preserva negativos, zero e ausência de dados", () => {
  assert.equal(chartNumber(null), null);
  assert.equal(chartNumber(""), null);
  assert.equal(chartNumber("0"), 0);
  assert.equal(chartNumber("-12.4"), -12.4);
  assert.equal(chartNumber("não informado"), null);
  assert.deepEqual(chartDomain([null, null]), {
    low: 0,
    high: 1,
    hasData: false,
  });
  assert.deepEqual(chartDomain([-100, 0, 50, null]), {
    low: -100,
    high: 50,
    hasData: true,
  });
  assert.deepEqual(chartDomain([0]), { low: 0, high: 1, hasData: true });
});
test("participações recusam base inválida e usam o denominador completo nas páginas", () => {
  assert.deepEqual(distribution([30, 20], 100).shares, [30, 20]);
  assert.deepEqual(distribution([30, 20]).shares, [60, 40]);
  for (const [values, base] of [
    [[0, 0], 0],
    [[30, null], 100],
    [[-5, 20], 15],
    [[40, 70], 100],
  ] as [Array<number | null>, number][]) {
    const result = distribution(values, base);
    assert.equal(result.valid, false);
    assert.ok(result.shares.every((v) => v === null));
  }
  assert.equal(distribution([10, 0], 10).valid, true);
  assert.equal(shareableMetric({ key: "total_sales", format: "money" }), true);
  for (const metric of [
    { key: "conversion", format: "percent" },
    { key: "average_order_value", format: "money" },
    { key: "duration", format: "hours" },
    { key: "value", calculated: true },
    { key: "conversion", ratio: ["orders", "sessions"] as [string, string] },
  ])
    assert.equal(shareableMetric(metric), false);
});
