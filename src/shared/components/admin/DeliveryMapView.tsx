"use client";
import { Grid2X2, MapPinned } from "lucide-react";
import type { readDestinations } from "../../server/sales/destinations";
import DottedDeliveryMap from "./DottedDeliveryMap";
import DeliveryMap from "./DeliveryMap";
export default function DeliveryMapView({
  cities,
  state,
  onStateChange,
  view,
  onViewChange,
}: {
  cities: Awaited<ReturnType<typeof readDestinations>>["cities"];
  state: string;
  onStateChange: (state: string) => void;
  view: "regions" | "cities";
  onViewChange: (view: "regions" | "cities") => void;
}) {
  return (
    <>
      <div className="delivery-view-toolbar">
        <div>
          <span className="admin-eyebrow">ALCANCE DA LOJA</span>
          <h2>Entregas por região</h2>
        </div>
        <div
          className="delivery-view-switch"
          role="group"
          aria-label="Visualização do mapa de entregas"
        >
          <button
            type="button"
            aria-pressed={view === "regions"}
            onClick={() => onViewChange("regions")}
          >
            <Grid2X2 size={15} />
            Pontilhado
          </button>
          <button
            type="button"
            aria-pressed={view === "cities"}
            onClick={() => onViewChange("cities")}
          >
            <MapPinned size={15} />
            Mapa de cidades
          </button>
        </div>
      </div>
      {view === "regions" ? (
        <DottedDeliveryMap
          cities={cities}
          selectedState={state}
          onStateChange={onStateChange}
        />
      ) : (
        <DeliveryMap cities={cities} />
      )}
    </>
  );
}
