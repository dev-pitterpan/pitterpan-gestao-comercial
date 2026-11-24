"use client";
import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import PitterSpinner from "./PitterSpinner";
import type { readDestinations } from "../../server/sales/destinations";
import type { Map as LeafletMap } from "leaflet";
import { worldDeliveries } from "../../lib/admin/world-deliveries";
import { deliveryRegionLevel } from "../../lib/admin/delivery-regions";
import {
  countryGeometry,
  containsLocation,
} from "../../lib/admin/delivery-map-geometry";
type City = Awaited<ReturnType<typeof readDestinations>>["cities"][number];
const number = (n: number) => n.toLocaleString("pt-BR");
export default function DeliveryMap({
  cities,
  country,
  onCountryChange,
  busy,
}: {
  cities: City[];
  country: string;
  onCountryChange: (code: string) => void;
  busy: boolean;
}) {
  const latest = useRef({ cities, country, onCountryChange, busy });
  latest.current = { cities, country, onCountryChange, busy };
  const updateRef = useRef<() => void>(() => {});
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const resetRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const located = cities.filter((c) => c.location);
  const missing = cities
    .filter((c) => !c.location)
    .reduce((sum, c) => sum + c.orders, 0);
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    setReady(false);
    setFailed(false);

    void import("leaflet")
      .then((L) => {
        if (cancelled || !container.current) return;
        const map = L.map(container.current, {
          scrollWheelZoom: true,
          zoomControl: true,
          minZoom: 1,
          maxZoom: 16,
          zoomSnap: 0.25,
          maxBounds: [
            [-85, -180],
            [85, 180],
          ],
          maxBoundsViscosity: 0.7,
        }).setView([20, 0], 1);
        mapRef.current = map;
        L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
        // Local cartography: no customer location or external tile request leaves the browser.
        const geometry = worldDeliveries([]).countries.map((item) => ({
          ...item,
          ...countryGeometry(item.path),
        }));
        const shapes = geometry.map((item) => new Path2D(item.path));
        const colors = ["#4d5359", "#715a82", "#9668a9", "#b47ccb", "#d39aeb"];
        const DottedLayer = L.GridLayer.extend({
          createTile(coords: { x: number; y: number; z: number }) {
            const tile = document.createElement("canvas");
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            tile.width = tile.height = 256 * ratio;
            const ctx = tile.getContext("2d")!;
            const scale = (256 * 2 ** coords.z) / 1024;
            ctx.setTransform(
              ratio * scale,
              0,
              0,
              ratio * scale,
              -coords.x * 256 * ratio,
              -coords.y * 256 * ratio,
            );
            const summary = worldDeliveries(latest.current.cities);
            geometry.forEach((item, i) => {
              const total = summary.countries[i].orders;
              ctx.fillStyle =
                item.code && item.code === latest.current.country
                  ? "#e2b2f6"
                  : colors[deliveryRegionLevel(total, summary.max)];
              ctx.fill(shapes[i], "evenodd");
            });
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            ctx.globalCompositeOperation = "destination-in";
            const pattern = document.createElement("canvas");
            pattern.width = pattern.height = 4 * ratio;
            const ink = pattern.getContext("2d")!;
            ink.scale(ratio, ratio);
            ink.beginPath();
            ink.arc(2, 2, 0.9, 0, Math.PI * 2);
            ink.fill();
            const dots = ctx.createPattern(pattern, "repeat")!;
            dots.setTransform(new DOMMatrix().scale(1 / ratio));
            ctx.fillStyle = dots;
            ctx.fillRect(0, 0, 256, 256);
            return tile;
          },
        });
        const tiles = new DottedLayer();
        L.setOptions(tiles, {
          noWrap: true,
          attribution: "Base cartográfica: Natural Earth",
        });
        tiles.addTo(map);
        map.on("click", (event) => {
          const current = latest.current;
          if (current.busy || current.country) return;
          const summary = worldDeliveries(current.cities);
          const selected = geometry.find(
            (item, i) =>
              item.code &&
              summary.countries[i].orders > 0 &&
              containsLocation(item.rings, event.latlng.lng, event.latlng.lat),
          );
          if (selected?.code) current.onCountryChange(selected.code);
        });
        const pointsForSelection = () =>
          latest.current.cities.filter(
            (
              c,
            ): c is City & {
              location: { latitude: number; longitude: number };
            } => c.location !== null && c.country === latest.current.country,
          );
        const reset = () => {
          const selected = geometry.find(
            (item) => item.code === latest.current.country,
          );
          if (selected)
            map.fitBounds(selected.bounds, {
              padding: [35, 35],
              maxZoom: 6,
              animate: false,
            });
          else
            map.fitBounds(
              [
                [-56, -180],
                [84, 180],
              ],
              { padding: [12, 12], animate: false },
            );
        };
        resetRef.current = () => {
          const points = pointsForSelection();
          if (points.length)
            map.fitBounds(
              L.latLngBounds(
                points.map((city) => [
                  city.location.latitude,
                  city.location.longitude,
                ]),
              ),
              { padding: [55, 55], maxZoom: 11 },
            );
          else reset();
        };
        reset();
        const markers = L.layerGroup().addTo(map);
        function draw() {
          markers.clearLayers();
          // Groups use screen distance, so nearby cities separate as the manager zooms in.
          const points = pointsForSelection();
          const groups = new Map<string, typeof points>();
          for (const city of points) {
            const position = map.project(
              [city.location.latitude, city.location.longitude],
              map.getZoom(),
            );
            const key = `${Math.floor(position.x / 64)}:${Math.floor(position.y / 64)}`;
            const group = groups.get(key) || [];
            group.push(city);
            groups.set(key, group);
          }
          for (const group of groups.values()) {
            const orders = group.reduce((n, c) => n + c.orders, 0),
              units = group.reduce((n, c) => n + c.units, 0);
            const lat =
              group.reduce((n, c) => n + c.location.latitude, 0) / group.length;
            const lng =
              group.reduce((n, c) => n + c.location.longitude, 0) /
              group.length;
            const places = [
              ...new Set(group.map((c) => `${c.city} · ${c.state}`)),
            ];
            const title = `${places.length === 1 ? places[0] : `${places.length} cidades`}: ${number(orders)} pedidos, ${number(units)} unidades`;
            const marker = L.marker([lat, lng], {
              alt: title,
              keyboard: true,
              icon: L.divIcon({
                className: "delivery-map-pin",
                html: `<span class="${places.length > 1 ? "is-cluster" : ""}">${number(orders)}</span>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              }),
              riseOnHover: true,
            }).addTo(markers);
            // DOM textContent avoids interpreting merchant or customer text as HTML.
            const tooltip = document.createElement("div");
            const tooltipTitle = document.createElement("strong");
            tooltipTitle.textContent =
              places.length === 1
                ? places[0]
                : `${places.length} cidades próximas`;
            const tooltipCount = document.createElement("span");
            tooltipCount.textContent = `${number(orders)} pedidos · ${number(units)} unidades`;
            tooltip.append(tooltipTitle, tooltipCount);
            const list = document.createElement("div");
            list.className = "delivery-map-city-list";
            for (const city of group.slice(0, 4)) {
              const row = document.createElement("div");
              const name = document.createElement("span");
              name.textContent = `${city.city} · ${city.state}`;
              const count = document.createElement("b");
              count.textContent = `${number(city.orders)} pedidos`;
              row.append(name, count);
              list.append(row);
            }
            if (places.length > 4) {
              const more = document.createElement("small");
              more.textContent = `Mais ${places.length - 4} cidades. Aproxime para detalhar.`;
              list.append(more);
            }
            if (places.length > 1) tooltip.append(list);
            // Explicit hover events keep Leaflet's click/touch bindings out.
            const hover = L.tooltip({
              direction: "auto",
              offset: [0, -14],
              className: "delivery-map-hover",
            }).setContent(tooltip);
            const showDetails = () =>
              hover.setLatLng(marker.getLatLng()).addTo(map);
            const hideDetails = () => hover.remove();
            marker.on("mouseover", showDetails);
            marker.on("mouseout", hideDetails);
            marker.on("remove", hideDetails);
            const element = marker.getElement();
            element?.setAttribute("aria-label", title);
            element?.addEventListener("focus", () => {
              if (element.matches(":focus-visible")) showDetails();
            });
            element?.addEventListener("blur", hideDetails);
            marker.on("click", () => {
              hideDetails();
              if (places.length > 1) {
                const groupBounds = L.latLngBounds(
                  group.map((c) => [c.location.latitude, c.location.longitude]),
                );
                map.fitBounds(groupBounds, {
                  padding: [65, 65],
                  maxZoom: Math.min(16, map.getZoom() + 3),
                });
              } else showDetails();
            });
          }
        }
        map.on("zoomend", draw);
        draw();
        let previousCountry = latest.current.country;
        updateRef.current = () => {
          tiles.redraw();
          if (previousCountry !== latest.current.country) {
            reset();
            previousCountry = latest.current.country;
          }
          draw();
        };
        const resize = new ResizeObserver(() =>
          map.invalidateSize({ animate: false }),
        );
        resize.observe(container.current);
        setReady(true);
        cleanup = () => {
          resize.disconnect();
          map.remove();
          mapRef.current = null;
          resetRef.current = () => {};
          updateRef.current = () => {};
        };
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
  useEffect(() => {
    updateRef.current();
  }, [cities, country]);
  return (
    <div className="delivery-map">
      <div className="delivery-map-toolbar">
        <span>
          <MapPin size={14} />
          {country
            ? `${number(located.reduce((n, c) => n + c.orders, 0))} pedidos localizados`
            : "Clique em um país destacado para explorar as cidades"}
        </span>
        <button
          className="admin-button"
          onClick={() => resetRef.current()}
          disabled={!ready}
        >
          <LocateFixed size={15} /> Enquadrar destinos
        </button>
      </div>
      <div className="delivery-map-stage">
        <div
          ref={container}
          className="delivery-map-canvas"
          role="region"
          aria-label="Mapa interativo das entregas por cidade. Passe o mouse ou use Tab nos pontos para consultar quantidades. Clique nos agrupamentos para aproximar."
        />
        {!ready && !failed && (
          <div className="delivery-map-overlay">
            <PitterSpinner label="Preparando o mapa…" />
          </div>
        )}
        {failed && (
          <div className="delivery-map-overlay" role="alert">
            Não foi possível abrir o mapa. Abra a categoria Destinos detalhados
            para consultar os pedidos.
          </div>
        )}
        {ready && country && !busy && !located.length && (
          <div className="delivery-map-empty">
            Nenhum destino localizado nesta seleção.
          </div>
        )}
      </div>
      <div className="delivery-map-legend">
        <span>
          <i /> Número no ponto = pedidos
        </span>
        <span>
          <i className="is-group" /> Pontos próximos são agrupados
        </span>
      </div>
      <p className="delivery-map-note">
        Localização aproximada por cidade, sem indicar o endereço do cliente.
        Passe o mouse nos pontos para ver pedidos e unidades. Clique nos
        agrupamentos para aproximar.
        {missing > 0 &&
          ` ${number(missing)} pedidos sem coordenadas nesta seleção estão na tabela.`}
      </p>
    </div>
  );
}
