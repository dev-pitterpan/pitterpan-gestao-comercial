"use client";
import type { readDestinations } from "../../server/sales/destinations";
import DottedDeliveryMap from "./DottedDeliveryMap";
export default function DeliveryMapView({
  cities,
  country,
  onCountryChange,
  available,
  busy,
}: {
  cities: Awaited<ReturnType<typeof readDestinations>>["cities"];
  country: string;
  onCountryChange: (country: string) => void;
  available: boolean;
  busy: boolean;
}) {
  return (
    <DottedDeliveryMap
      cities={cities}
      country={country}
      onCountryChange={onCountryChange}
      available={available}
      busy={busy}
    />
  );
}
