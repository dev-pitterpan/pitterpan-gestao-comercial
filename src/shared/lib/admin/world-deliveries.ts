import countries from "./world-countries.json" with { type: "json" };
import type { DeliveryRegionCity } from "./delivery-regions.ts";
const names = new Intl.DisplayNames(["pt-BR"], { type: "region" });
export function deliveryCountryName(code: string | null) {
  if (!code) return "País não informado";
  try {
    return names.of(code) || code;
  } catch {
    return code;
  }
}
export function countryFlag(code: string | null) {
  return code && /^[A-Z]{2}$/.test(code)
    ? [...code]
        .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
        .join("")
    : "—";
}
export function worldDeliveries(cities: DeliveryRegionCity[]) {
  const totals = new Map<
    string,
    { code: string; name: string; orders: number; units: number }
  >();
  let unknown = 0;
  for (const city of cities) {
    const code = city.country?.trim().toUpperCase();
    if (!code || !/^[A-Z]{2}$/.test(code)) {
      unknown += city.orders;
      continue;
    }
    const row = totals.get(code) || {
      code,
      name: deliveryCountryName(code),
      orders: 0,
      units: 0,
    };
    row.orders += city.orders;
    row.units += city.units;
    totals.set(code, row);
  }
  const ranking = [...totals.values()].sort(
    (a, b) => b.orders - a.orders || a.name.localeCompare(b.name, "pt-BR"),
  );
  const geometryCodes = new Set(
    countries.map((country) => country.code).filter(Boolean),
  );
  const outside =
    unknown +
    ranking
      .filter((country) => !geometryCodes.has(country.code))
      .reduce((sum, country) => sum + country.orders, 0);
  return {
    countries: countries.map((country) => ({
      ...country,
      orders: country.code ? totals.get(country.code)?.orders || 0 : 0,
      units: country.code ? totals.get(country.code)?.units || 0 : 0,
    })),
    ranking,
    total: cities.reduce((sum, city) => sum + city.orders, 0),
    outside,
    max: Math.max(0, ...ranking.map((country) => country.orders)),
  };
}
