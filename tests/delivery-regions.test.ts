import test from "node:test";
import assert from "node:assert/strict";
import {
  deliveryRegions,
  deliveryRegionLevel,
} from "../src/shared/lib/admin/delivery-regions.ts";

test("mapa regional agrega cidades por UF e mantém pedidos fora do Brasil ou sem UF separados", () => {
  const result = deliveryRegions([
    { country: "BR", state: "SC", orders: 4, units: 9 },
    { country: "BR", state: "sc", orders: 3, units: 5 },
    { country: "BR", state: "PR", orders: 2, units: 4 },
    { country: "US", state: "SC", orders: 8, units: 10 },
    { country: "BR", state: "XX", orders: 1, units: 2 },
    { country: null, state: null, orders: 2, units: 3 },
  ]);
  assert.equal(result.regions.length, 27);
  assert.equal(result.total, 9);
  assert.equal(result.outside, 11);
  assert.equal(result.max, 7);
  assert.deepEqual(
    result.ranking.map((region) => [region.state, region.orders, region.units]),
    [
      ["SC", 7, 14],
      ["PR", 2, 4],
    ],
  );
  assert.equal(
    result.regions.find((region) => region.state === "SP")?.orders,
    0,
  );
  assert.equal(result.total + result.outside, 20);
});
test("mapa vazio preserva os estados e não inventa concentração ou pedidos", () => {
  const result = deliveryRegions([]);
  assert.equal(result.total, 0);
  assert.equal(result.outside, 0);
  assert.equal(result.max, 0);
  assert.equal(result.ranking.length, 0);
  assert.ok(
    result.regions.every((region) => region.orders === 0 && region.units === 0),
  );
  const next = deliveryRegions([
    { country: "BR", state: "SC", orders: 1, units: 1 },
  ]);
  assert.equal(next.total, 1);
  assert.equal(deliveryRegions([]).total, 0);
});
test("intensidade usa a maior quantidade real da seleção, com ausência distinta de concentração baixa", () => {
  assert.equal(deliveryRegionLevel(0, 100), 0);
  assert.equal(deliveryRegionLevel(0, 0), 0);
  assert.equal(deliveryRegionLevel(1, 100), 1);
  assert.equal(deliveryRegionLevel(25, 100), 1);
  assert.equal(deliveryRegionLevel(26, 100), 2);
  assert.equal(deliveryRegionLevel(75, 100), 3);
  assert.equal(deliveryRegionLevel(100, 100), 4);
  assert.equal(deliveryRegionLevel(1, 1), 4);
});
