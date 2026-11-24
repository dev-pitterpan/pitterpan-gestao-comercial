"use client";
import { useMemo } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { worldDeliveries, countryFlag } from "../../lib/admin/world-deliveries";
import DeliveryMap from "./DeliveryMap";
import type { readDestinations } from "../../server/sales/destinations";
const number = (value: number) => value.toLocaleString("pt-BR");
export default function DottedDeliveryMap({
  cities,
  country,
  onCountryChange,
  available = true,
  busy = false,
}: {
  cities: Awaited<ReturnType<typeof readDestinations>>["cities"];
  country: string;
  onCountryChange: (country: string) => void;
  available?: boolean;
  busy?: boolean;
}) {
  const data = useMemo(() => worldDeliveries(cities), [cities]);
  function select(code: string | null) {
    if (!code || busy || !available) return;
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
        <DeliveryMap
          cities={cities}
          country={country}
          onCountryChange={onCountryChange}
          busy={busy}
        />
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
            Voltar ao mapa mundial
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
