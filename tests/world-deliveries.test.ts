import test from "node:test";
import assert from "node:assert/strict";
import {
  worldDeliveries,
  deliveryCountryName,
  countryFlag,
} from "../src/shared/lib/admin/world-deliveries.ts";
test("mapa mundial agrega países reais sem converter pedidos internacionais em destinos brasileiros", () => {
  const result = worldDeliveries([
    { country: "BR", state: "SC", orders: 4, units: 9 },
    { country: "br", state: "PR", orders: 2, units: 5 },
    { country: "US", state: "SC", orders: 3, units: 7 },
    { country: "PT", state: null, orders: 1, units: 2 },
    { country: null, state: null, orders: 2, units: 4 },
  ]);
  assert.equal(result.total, 12);
  assert.equal(result.outside, 2);
  assert.equal(result.max, 6);
  assert.deepEqual(
    result.ranking.map((item) => [item.code, item.orders, item.units]),
    [
      ["BR", 6, 14],
      ["US", 3, 7],
      ["PT", 1, 2],
    ],
  );
  assert.equal(result.countries.find((item) => item.code === "BR")?.orders, 6);
  assert.equal(result.countries.find((item) => item.code === "US")?.orders, 3);
  assert.equal(result.countries.find((item) => item.code === "FR")?.orders, 0);
});
test("países sem contorno na escala são contabilizados e base vazia permanece neutra", () => {
  const result = worldDeliveries([
    { country: "SG", state: null, orders: 2, units: 4 },
  ]);
  assert.equal(result.total, 2);
  assert.equal(result.outside, 2);
  assert.equal(result.ranking[0].code, "SG");
  const empty = worldDeliveries([]);
  assert.equal(empty.total, 0);
  assert.equal(empty.max, 0);
  assert.equal(empty.ranking.length, 0);
  assert.ok(empty.countries.every((country) => country.orders === 0));
  for (const code of ["BR", "US", "PT", "NO", "FR", "JP", "AU"]) {
    assert.ok(
      empty.countries.some(
        (country) => country.code === code && country.path.startsWith("M"),
      ),
      code,
    );
  }
  assert.ok(!empty.countries.some((country) => country.code === "AQ"));
});
test("nomes de países e bandeiras têm fallback legível sem interpretar texto como HTML", () => {
  assert.equal(deliveryCountryName("BR"), "Brasil");
  assert.equal(deliveryCountryName(null), "País não informado");
  assert.equal(countryFlag("BR"), "🇧🇷");
  assert.equal(countryFlag(null), "—");
  assert.equal(countryFlag("<script>"), "—");
});
