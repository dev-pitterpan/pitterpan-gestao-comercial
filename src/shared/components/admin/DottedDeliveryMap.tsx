"use client";
import { useId, useMemo, useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { worldDeliveries, countryFlag } from "../../lib/admin/world-deliveries";
import {
  deliveryRegionLevel,
  type DeliveryRegionCity,
} from "../../lib/admin/delivery-regions";
const number = (value: number) => value.toLocaleString("pt-BR");
export default function DottedDeliveryMap({
  cities,
  country,
  onCountryChange,
  available = true,
  busy = false,
}: {
  cities: DeliveryRegionCity[];
  country: string;
  onCountryChange: (country: string) => void;
  available?: boolean;
  busy?: boolean;
}) {
  const id = useId(),
    [hovered, setHovered] = useState("");
  const data = useMemo(() => worldDeliveries(cities), [cities]);
  const active = data.countries.find(
    (item) => item.code === (hovered || country),
  );
  function select(code: string | null) {
    if (!code || busy || !available) return;
    setHovered("");
    onCountryChange(code === country ? "" : code);
  }
  return (
    <section
      className="delivery-world-card"
      aria-label="Distribuição mundial dos pedidos"
      aria-busy={busy}
    >
      <header>
        <div>
          <span className="delivery-world-eyebrow">ALCANCE DAS ENTREGAS</span>
          <h2>Destinos das vendas</h2>
        </div>
        <span className="delivery-world-period">
          {busy
            ? "Atualizando seleção…"
            : available
              ? "Seleção atual"
              : "Dados indisponíveis"}
          <i />
        </span>
      </header>
      <div
        className="delivery-world-countries"
        aria-label="Países com mais pedidos"
      >
        {data.ranking.length ? (
          data.ranking.slice(0, 4).map((item) => (
            <button
              type="button"
              key={item.code}
              onClick={item.orders > 0 ? () => select(item.code) : undefined}
              aria-pressed={country === item.code}
              disabled={busy}
            >
              <span>{countryFlag(item.code)}</span>
              {item.name}
              <b>{number(item.orders)}</b>
            </button>
          ))
        ) : (
          <span>
            {available && !busy
              ? "Nenhum país com pedidos nesta seleção."
              : "A distribuição aparece quando os pedidos forem carregados."}
          </span>
        )}
      </div>
      <div className="delivery-world-visual">
        <svg
          viewBox="-8 -8 880 380"
          role="group"
          aria-label="Mapa mundial pontilhado. Os países com pedidos são destacados. Selecione um país para filtrar os destinos."
        >
          <defs>
            {[0, 1, 2, 3, 4, "active"].map((level) => (
              <pattern
                id={`${id}-${level}`}
                key={level}
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="2"
                  cy="2"
                  r=".9"
                  className={`delivery-world-dot delivery-world-dot--${level}`}
                />
              </pattern>
            ))}
          </defs>
          {data.countries.map((item, index) => {
            const selected = !!item.code && country === item.code;
            const highlight = !!item.code && hovered === item.code;
            return (
              <g
                key={`${item.code}-${index}`}
                className={`delivery-world-country${selected ? " is-selected" : ""}`}
                role={item.code && item.orders > 0 ? "button" : undefined}
                tabIndex={
                  item.code && item.orders > 0 && available && !busy
                    ? 0
                    : undefined
                }
                aria-label={`${item.name}: ${number(item.orders)} pedidos`}
                aria-pressed={
                  item.code && item.orders > 0 ? selected : undefined
                }
                onMouseEnter={() => setHovered(item.code || "")}
                onMouseLeave={() => setHovered("")}
                onFocus={() => setHovered(item.code || "")}
                onBlur={() => setHovered("")}
                onClick={item.orders > 0 ? () => select(item.code) : undefined}
                onKeyDown={(event) => {
                  if (
                    (event.key === "Enter" || event.key === " ") &&
                    item.orders > 0
                  ) {
                    event.preventDefault();
                    select(item.code);
                  }
                }}
              >
                <title>
                  {item.name} ·{" "}
                  {available
                    ? `${number(item.orders)} pedidos`
                    : "Sem dados carregados"}
                </title>
                <path
                  d={item.path}
                  fill={`url(#${id}-${selected || highlight ? "active" : deliveryRegionLevel(item.orders, data.max)})`}
                  fillRule="evenodd"
                />
              </g>
            );
          })}
        </svg>
        {active && available && (
          <div className="delivery-world-hover" role="status">
            <span>
              {countryFlag(active.code)} {active.name}
            </span>
            <strong>{number(active.orders)} pedidos</strong>
            <small>{number(active.units)} unidades</small>
          </div>
        )}
      </div>
      <footer>
        <div className="delivery-world-scale">
          <span>Sem pedidos</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i key={level} data-level={level} />
          ))}
          <span>Mais pedidos</span>
        </div>
        {country ? (
          <button type="button" onClick={() => onCountryChange("")}>
            Limpar país · {country}
            <X size={12} />
          </button>
        ) : (
          <span>
            Selecione um país para explorar
            <ArrowUpRight size={12} />
          </span>
        )}
      </footer>
      {data.outside > 0 && (
        <p className="delivery-world-note">
          {number(data.outside)} pedidos sem país ou em territórios sem contorno
          nesta escala continuam na tabela.
        </p>
      )}
    </section>
  );
}
