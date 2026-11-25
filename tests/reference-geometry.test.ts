import test from "node:test";
import assert from "node:assert/strict";
import {
  annularSector,
  fanRadius,
  peakPolygon,
  polar,
} from "../src/shared/lib/admin/reference-geometry.ts";
test("leque radial codifica a área do setor proporcionalmente ao valor real", () => {
  const inner = 48,
    outer = 123;
  assert.equal(fanRadius(0, 100), inner);
  assert.equal(fanRadius(-1, 100), inner);
  assert.equal(fanRadius(10, 0), inner);
  assert.equal(fanRadius(100, 100), outer);
  const a = fanRadius(25, 100),
    b = fanRadius(50, 100);
  assert.ok(
    Math.abs((b * b - inner * inner) / (a * a - inner * inner) - 2) < 1e-10,
  );
  assert.equal(fanRadius(200, 100), outer);
});
test("setores cobrem círculo completo sem sumir e picos respeitam zero e sinal", () => {
  assert.equal(annularSector(0, 0, 48, 48, 0, 90), "");
  assert.equal(annularSector(0, 0, 48, 123, 90, 0), "");
  for (const end of [0.01, 90, 180, 270, 360]) {
    const path = annularSector(160, 144, 48, 123, -90, -90 + end);
    assert.ok(path.startsWith("M"));
    assert.ok(path.endsWith("Z"));
    assert.ok(!/NaN|Infinity/.test(path));
  }
  assert.equal(
    (annularSector(160, 144, 48, 123, 0, 360).match(/ A/g) || []).length,
    4,
  );
  assert.equal(peakPolygon(20, 100, 100, 10), "");
  assert.equal(peakPolygon(20, 100, 20, 10), "15,100 20,20 25,100");
  assert.equal(peakPolygon(20, 100, 130, 10), "15,100 20,130 25,100");
  const point = polar(160, 144, 100, -90);
  assert.ok(Math.abs(point.x - 160) < 1e-10);
  assert.equal(point.y, 44);
});
