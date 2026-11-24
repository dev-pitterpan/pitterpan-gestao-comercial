import states from "./brazil-states.json" with { type: "json" };
export type DeliveryRegionCity = {
  country: string | null;
  state: string | null;
  orders: number;
  units: number;
};
/** Regional totals do not require municipal geocoding or any customer address. */
export function deliveryRegions(cities: DeliveryRegionCity[]) {
  const byState = new Map(
    states.map((state) => [state.state, { ...state, orders: 0, units: 0 }]),
  );
  let outside = 0;
  for (const city of cities) {
    const region =
      city.country === "BR" && city.state
        ? byState.get(city.state.trim().toUpperCase())
        : undefined;
    if (region) {
      region.orders += city.orders;
      region.units += city.units;
    } else outside += city.orders;
  }
  const regions = [...byState.values()];
  return {
    regions,
    total: regions.reduce((sum, region) => sum + region.orders, 0),
    outside,
    max: Math.max(0, ...regions.map((region) => region.orders)),
    ranking: regions
      .filter((region) => region.orders > 0)
      .sort(
        (a, b) => b.orders - a.orders || a.name.localeCompare(b.name, "pt-BR"),
      ),
  };
}
export function deliveryRegionLevel(orders: number, max: number) {
  return orders <= 0 || max <= 0
    ? 0
    : Math.min(4, Math.ceil((orders / max) * 4));
}
