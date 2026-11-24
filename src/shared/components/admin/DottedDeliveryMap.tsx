"use client";
import { useId, useMemo, useState } from "react";
import { MapPin, ArrowUpRight, X, Globe2 } from "lucide-react";
import {
  deliveryRegions,
  deliveryRegionLevel,
  type DeliveryRegionCity,
} from "../../lib/admin/delivery-regions";
const number = (value: number) => value.toLocaleString("pt-BR");
export default function DottedDeliveryMap({
  cities,
  selectedState,
  onStateChange,
}: {
  cities: DeliveryRegionCity[];
  selectedState: string;
  onStateChange: (state: string) => void;
}) {
  const id = useId(),
    [hovered, setHovered] = useState("");
  const data = useMemo(() => deliveryRegions(cities), [cities]);
  const active = data.regions.find(
    (region) =>
      region.state === (hovered || selectedState || data.ranking[0]?.state),
  );
  function select(state: string) {
    setHovered("");
    onStateChange(state === selectedState ? "" : state);
  }
  return (
    <div className="dotted-delivery-card">
      <header className="dotted-map-heading">
        <div>
          <span>
            <Globe2 size={14} />
            DISTRIBUIÇÃO REGIONAL
          </span>
          <h3>Para onde vão os pedidos</h3>
        </div>
        <span className="dotted-map-country">🇧🇷 Brasil</span>
      </header>
      <div className="dotted-map-topline">
        <strong>
          {number(data.total)}
          <span>pedidos no mapa</span>
        </strong>
        <div>
          {data.ranking.slice(0, 3).map((region) => (
            <button
              key={region.state}
              type="button"
              onClick={() => select(region.state)}
              aria-pressed={selectedState === region.state}
            >
              <i />
              {region.state}
              <b>{number(region.orders)}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="dotted-map-layout">
        <div className="dotted-map-visual">
          <svg
            viewBox="-12 -12 540 540"
            role="group"
            aria-label="Mapa pontilhado do Brasil. Cada estado mostra os pedidos da seleção. Use Tab e Enter para filtrar por estado."
          >
            <defs>
              {[0, 1, 2, 3, 4, "active"].map((level) => (
                <pattern
                  key={level}
                  id={`${id}-dots-${level}`}
                  width="4.6"
                  height="4.6"
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="2.3"
                    cy="2.3"
                    r={level === "active" ? 1.32 : 1.05}
                    className={`dotted-map-dot dotted-map-dot--${level}`}
                  />
                </pattern>
              ))}
            </defs>
            {data.regions.map((region) => {
              const isSelected = region.state === selectedState;
              const focused = region.state === hovered;
              const level = deliveryRegionLevel(region.orders, data.max);
              return (
                <g
                  key={region.state}
                  role="button"
                  tabIndex={0}
                  aria-label={`${region.name}: ${number(region.orders)} pedidos e ${number(region.units)} unidades. ${isSelected ? "Remover filtro" : "Filtrar cidades deste estado"}.`}
                  aria-pressed={isSelected}
                  className={`dotted-map-region${isSelected ? " is-selected" : ""}`}
                  onMouseEnter={() => setHovered(region.state)}
                  onMouseLeave={() => setHovered("")}
                  onFocus={() => setHovered(region.state)}
                  onBlur={() => setHovered("")}
                  onClick={() => select(region.state)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select(region.state);
                    }
                  }}
                >
                  <title>
                    {region.name} · {number(region.orders)} pedidos
                  </title>
                  <path
                    d={region.path}
                    fill={`url(#${id}-dots-${focused || isSelected ? "active" : level})`}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        <aside
          className="dotted-map-readout"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="dotted-map-readout-icon">
            <MapPin size={21} />
          </span>
          <span className="dotted-map-overline">
            {selectedState ? "ESTADO SELECIONADO" : "EXPLORE O MAPA"}
          </span>
          <h4>{active?.name || "Brasil"}</h4>
          <strong>
            {active ? number(active.orders) : number(data.total)}
            <small>pedidos</small>
          </strong>
          <p>
            {active
              ? `${number(active.units)} unidades na seleção`
              : "Nenhum pedido por estado brasileiro nesta seleção."}
          </p>
          <span className="dotted-map-hint">
            Selecione um estado para consultar suas cidades na tabela.
          </span>
          {selectedState ? (
            <button
              type="button"
              className="dotted-map-clear"
              onClick={() => {
                setHovered("");
                onStateChange("");
              }}
            >
              Limpar estado · {selectedState}
              <X size={13} />
            </button>
          ) : (
            active && (
              <button
                type="button"
                className="dotted-map-clear"
                onClick={() => select(active.state)}
              >
                Ver cidades de {active.state}
                <ArrowUpRight size={13} />
              </button>
            )
          )}
        </aside>
      </div>
      <footer className="dotted-map-footer">
        <div className="dotted-map-scale">
          <span>Sem pedidos</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i key={level} data-level={level} />
          ))}
          <span>Mais pedidos</span>
        </div>
        <p>
          Distribuição por UF; não indica endereços de clientes.
          {data.outside > 0
            ? ` ${number(data.outside)} pedidos internacionais ou sem UF brasileira válida ficam fora do mapa e continuam na tabela.`
            : ""}
        </p>
      </footer>
    </div>
  );
}
