"use client";
import type { readDestinations } from "../../server/sales/destinations";
import DottedDeliveryMap from "./DottedDeliveryMap";
import DeliveryMap from "./DeliveryMap";
export default function DeliveryMapView({
  cities,
  country,
  onCountryChange,
  view,
  available,
  busy,
}: {
  cities: Awaited<ReturnType<typeof readDestinations>>["cities"];
  country: string;
  onCountryChange: (country: string) => void;
  view: "world" | "cities";
  available: boolean;
  busy: boolean;
}) {
  return view === "world" ? (
    <DottedDeliveryMap
      cities={cities}
      country={country}
      onCountryChange={onCountryChange}
      available={available}
      busy={busy}
    />
  ) : (
    <section className="delivery-city-map-card">
      <header>
        <h2>Mapa de cidades</h2>
        <p>Localização aproximada dos destinos brasileiros identificados.</p>
      </header>
      {available ? (
        <DeliveryMap cities={cities} />
      ) : (
        <div className="delivery-panel-empty">
          {busy
            ? "Carregando destinos…"
            : "Consulte a integração para carregar os destinos."}
        </div>
      )}
    </section>
  );
}
