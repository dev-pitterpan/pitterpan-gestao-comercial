import test from "node:test";
import assert from "node:assert/strict";
import { financialComposition } from "../src/shared/lib/admin/financial-composition.ts";
test("composição financeira divide somente valores recebidos e preserva casos sem base", () => {
  const parts = financialComposition("100.00", "25.00");
  assert.equal(parts.state, "balanced");
  assert.equal(parts.net, 75);
  assert.equal(parts.netShare, 0.75);
  assert.equal(parts.refundShare, 0.25);
  assert.equal(financialComposition("100", "0").netShare, 1);
  assert.equal(financialComposition("100", "100").netShare, 0);
  assert.equal(financialComposition("0", "0").state, "empty");
  assert.equal(financialComposition("0", "0").netShare, null);
  const excess = financialComposition("10", "30");
  assert.equal(excess.state, "excess");
  assert.equal(excess.net, -20);
  assert.equal(excess.refundShare, null);
  for (const pair of [
    ["", "0"],
    ["abc", "0"],
    ["-1", "0"],
    ["1", "-1"],
    ["Infinity", "0"],
  ])
    assert.equal(financialComposition(pair[0], pair[1]).state, "invalid");
});
