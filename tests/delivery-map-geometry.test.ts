import { test } from "node:test";
import assert from "node:assert/strict";
import countries from "../src/shared/lib/admin/world-countries.json" with { type: "json" };
import {
  countryGeometry,
  containsLocation,
  mercatorPoint,
} from "../src/shared/lib/admin/delivery-map-geometry.ts";
test("cartografia e marcadores compartilham Web Mercator sem infinitos nos polos", () => {
  assert.deepEqual(mercatorPoint(0, 0), [512, 512]);
  assert.equal(mercatorPoint(180, 0)[0], 1024);
  for (const lat of [-90, -85, 85, 90])
    assert.ok(mercatorPoint(0, lat).every(Number.isFinite));
});
test("clique identifica Brasil e ilhas por contorno, sem selecionar o oceano ou países vizinhos", () => {
  const brazil = countryGeometry(countries.find((c) => c.code === "BR")!.path);
  assert.ok(containsLocation(brazil.rings, -48.846, -26.304)); // Joinville
  assert.ok(containsLocation(brazil.rings, -47.88, -15.79)); // Brasília
  assert.equal(containsLocation(brazil.rings, -70.66, -33.45), false); // Santiago
  assert.equal(containsLocation(brazil.rings, -20, -20), false);
  assert.ok(brazil.bounds[0][0] < -33 && brazil.bounds[1][0] > 5);
  for (const country of countries) {
    const geometry = countryGeometry(country.path);
    assert.ok(geometry.rings.length > 0);
    assert.equal(/NaN|Infinity/.test(geometry.path), false);
  }
});
test("furos e múltiplas ilhas respeitam contenção par/ímpar", () => {
  const rings: [number, number][][] = [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ],
    [
      [2, 2],
      [4, 2],
      [4, 4],
      [2, 4],
    ],
    [
      [20, 20],
      [21, 20],
      [21, 21],
      [20, 21],
    ],
  ];
  assert.equal(containsLocation(rings, 1, 1), true);
  assert.equal(containsLocation(rings, 3, 3), false);
  assert.equal(containsLocation(rings, 20.5, 20.5), true);
});
