"use client";
import HeaderFilterGroup from "./HeaderFilterGroup";
import WorkspaceQueryControls from "./WorkspaceQueryControls";
import { PageHeading } from "./Primitives";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Globe2,
  ListFilter,
  X,
  ArrowUpRight,
  Package,
  MapPin,
  Layers3,
  Flag,
  RefreshCw,
  Info,
} from "lucide-react";
import AdminSelect from "./AdminSelect";
import DateRangePicker from "./DateRangePicker";
import {
  dateRangeSchema,
  shiftDate,
  todayDate,
  type DateRange,
} from "../../lib/admin/date-range";
import PitterSpinner from "./PitterSpinner";
import DeliveryMapView from "./DeliveryMapView";
import TablePagination from "./TablePagination";
import { deliveryFilterKinds, deliveryLabels } from "../../lib/admin/delivery";
import {
  countryFlag,
  deliveryCountryName,
  worldDeliveries,
} from "../../lib/admin/world-deliveries";
import type { readDestinations } from "../../server/sales/destinations";
type Data = Awaited<ReturnType<typeof readDestinations>>;
type Section = "world" | "destinations";
const number = (value: number) => value.toLocaleString("pt-BR");
const defaultRange = (days = 30) => {
  const end = todayDate();
  return { start: shiftDate(end, 1 - days), end };
};
export default function DestinationsDashboard() {
  const params = useSearchParams();
  const initialRange = dateRangeSchema.safeParse({
    start: params.get("start") || "",
    end: params.get("end") || "",
  });
  const [range, setRange] = useState<DateRange>(() =>
    initialRange.success && initialRange.data.start
      ? initialRange.data
      : defaultRange(
          [7, 30, 60].includes(Number(params.get("days")))
            ? Number(params.get("days"))
            : 30,
        ),
  );
  const [section, setSection] = useState<Section>(
    params.get("painel") === "destinations" ? "destinations" : "world",
  );
  const [delivery, setDelivery] = useState(
    deliveryFilterKinds.includes(
      params.get("delivery") as (typeof deliveryFilterKinds)[number],
    )
      ? params.get("delivery")!
      : "all",
  );
  const [fulfillment, setFulfillment] = useState(
    ["FULFILLED", "PARTIALLY_FULFILLED", "UNFULFILLED"].includes(
      params.get("fulfillment") || "",
    )
      ? params.get("fulfillment")!
      : "all",
  );
  const [state, setState] = useState(
    /^[A-Z]{2}$/.test(params.get("state") || "") ? params.get("state")! : "",
  );
  const [country, setCountry] = useState(
    /^[A-Z]{2}$/.test(params.get("country") || "")
      ? params.get("country")!
      : "",
  );
  const [q, setQ] = useState((params.get("q") || "").slice(0, 150)),
    [search, setSearch] = useState(q),
    [cityPage, setCityPage] = useState(1),
    [revision, setRevision] = useState(0);
  const [data, setData] = useState<Data | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(q), 400);
    return () => clearTimeout(timer);
  }, [q]);
  useEffect(() => {
    const url = new URL(window.location.href);
    const values = {
      ...range,
      country,
      state,
      delivery: delivery === "all" ? "" : delivery,
      fulfillment: fulfillment === "all" ? "" : fulfillment,
      q: search,
      painel: section === "world" ? "" : section,
    };
    url.searchParams.delete("days");
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href !== window.location.href)
      window.history.replaceState(null, "", url);
  }, [range, country, state, delivery, fulfillment, search, section]);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setData(null);
    setError("");
    setCityPage(1);
    const query = new URLSearchParams({
      days: "30",
      start: range.start,
      end: range.end,
      delivery,
      fulfillment,
      state,
      country,
      q: search,
    });
    void fetch(`/api/admin/destinations/?${query}`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw Error(body.error || "Não foi possível consultar os destinos.");
        if (!controller.signal.aborted) setData(body);
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : "Falha na consulta.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [
    range.start,
    range.end,
    delivery,
    fulfillment,
    state,
    country,
    search,
    revision,
  ]);
  const cities = data?.cities || [];
  const summary = useMemo(() => worldDeliveries(cities), [data]);
  const units = cities.reduce((sum, city) => sum + city.units, 0);
  const hasFilters =
    country || state || delivery !== "all" || fulfillment !== "all" || q;
  function selectCountry(value: string) {
    setCountry(value);
    setState("");
  }
  const countryOptions = [
    ...new Set([...(data?.countries || []), ...(country ? [country] : [])]),
  ];
  return (
    <div className="delivery-command-center">
      <PageHeading
        eyebrow="INTELIGÊNCIA DE ENTREGAS"
        title="Mapa de entregas"
        description="Acompanhe o alcance da loja e explore cada destino."
        filters={
          <DateRangePicker
            value={range}
            resetLabel="Voltar aos últimos 30 dias"
            onChange={(value) => setRange(value.start ? value : defaultRange())}
          />
        }
      />
      <nav
        className="delivery-content-tabs"
        aria-label="Categorias das entregas"
      >
        {[
          { id: "world", label: "Mapa de entregas", icon: Globe2 },
          {
            id: "destinations",
            label: "Destinos detalhados",
            icon: ListFilter,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              aria-current={section === tab.id ? "page" : undefined}
              onClick={() => setSection(tab.id as Section)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      <WorkspaceQueryControls>
        <div
          className="workspace-query-group"
          role="group"
          aria-label="Filtros de destinos"
        >
          <AdminSelect
            id="destination-country"
            triggerLabel="País"
            label="País de destino"
            value={country}
            onValueChange={selectCountry}
            options={[
              { value: "", label: "Todos os países" },
              ...countryOptions.map((code) => ({
                value: code,
                label: `${countryFlag(code)} ${deliveryCountryName(code)}`,
              })),
            ]}
          />
          <AdminSelect
            id="destination-state"
            triggerLabel="Estado"
            label="Estado de destino"
            value={state}
            onValueChange={(value) => {
              setState(value);
              if (value) setCountry("BR");
            }}
            options={[
              { value: "", label: "Todas as UFs brasileiras" },
              ..."AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO"
                .split(" ")
                .map((uf) => ({ value: uf, label: uf })),
            ]}
          />
          <AdminSelect
            id="destination-delivery"
            triggerLabel="Entrega"
            label="Entrega"
            value={delivery}
            onValueChange={setDelivery}
            options={[
              { value: "all", label: "Todas as entregas" },
              ...deliveryFilterKinds.map((kind) => ({
                value: kind,
                label: deliveryLabels[kind],
              })),
            ]}
          />
          <AdminSelect
            id="destination-fulfillment"
            triggerLabel="Atendimento"
            label="Situação do atendimento"
            value={fulfillment}
            onValueChange={setFulfillment}
            options={[
              { value: "all", label: "Todas as situações" },
              { value: "FULFILLED", label: "Atendimento concluído" },
              {
                value: "PARTIALLY_FULFILLED",
                label: "Atendimento parcial",
              },
              { value: "UNFULFILLED", label: "Atendimento pendente" },
            ]}
          />
          <HeaderFilterGroup
            inline
            label="Buscar destino"
            activeCount={search ? 1 : 0}
            activeValue={search}
          >
            <input
              id="delivery-search"
              type="search"
              className="admin-filter-input"
              aria-label="Buscar cidade, estado ou país"
              value={q}
              maxLength={150}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Cidade, estado ou país…"
            />
          </HeaderFilterGroup>
          {hasFilters && (
            <button
              type="button"
              className="header-query-clear"
              onClick={() => {
                setCountry("");
                setState("");
                setDelivery("all");
                setFulfillment("all");
                setQ("");
              }}
            >
              <X size={14} aria-hidden="true" /> Limpar filtros
            </button>
          )}
          <button
            type="button"
            className="admin-button"
            onClick={() => setRevision((value) => value + 1)}
            disabled={busy}
            aria-label="Atualizar destinos"
          >
            <RefreshCw size={15} className={busy ? "sales-spin" : ""} />
            {busy ? "Consultando…" : "Atualizar"}
          </button>
        </div>
      </WorkspaceQueryControls>
      {error && (
        <p className="admin-data-notice" role="alert">
          {error}
        </p>
      )}
      <section
        className="delivery-metrics"
        aria-label="Indicadores dos destinos"
      >
        {[
          {
            label: "Pedidos de entrega",
            value: data?.total,
            icon: Package,
            tone: "blue",
            detail: "Destinos da seleção",
          },
          {
            label: "Destinos registrados",
            value: data ? cities.length : undefined,
            icon: MapPin,
            tone: "teal",
            detail: "Cidades agrupadas por UF e país",
          },
          {
            label: "Unidades nos pedidos",
            value: data ? units : undefined,
            icon: Layers3,
            tone: "amber",
            detail: "Quantidade atual dos itens",
          },
          {
            label: "Países identificados",
            value: data ? summary.ranking.length : undefined,
            icon: Flag,
            tone: "rose",
            detail: "Países registrados nos pedidos",
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={`delivery-metric is-${metric.tone}`}
            >
              <div>
                <span>{metric.label}</span>
                <Icon size={17} />
              </div>
              <strong>
                {metric.value === undefined ? "—" : number(metric.value)}
              </strong>
              <small>{metric.detail}</small>
            </div>
          );
        })}
      </section>
      {section !== "destinations" ? (
        <div className="delivery-overview-grid">
          <DeliveryMapView
            cities={cities}
            country={country}
            onCountryChange={selectCountry}
            available={!!data}
            busy={busy}
          />
          <aside className="delivery-leading-card">
            <header>
              <div>
                <span>DESTINOS EM DESTAQUE</span>
                <h2>Onde mais entregamos</h2>
              </div>
              <MapPin size={18} />
            </header>
            <p>Cidades com mais pedidos na seleção atual.</p>
            {data?.cities.length ? (
              <ol>
                {cities.slice(0, 5).map((city, index) => (
                  <li
                    key={`${city.country}-${city.state}-${city.city}-${index}`}
                  >
                    <span className="delivery-leading-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{city.city || "Cidade não informada"}</strong>
                      <span>
                        {[city.state, deliveryCountryName(city.country)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <i>
                        <b
                          style={{
                            width: `${data.total ? (city.orders / data.total) * 100 : 0}%`,
                          }}
                        />
                      </i>
                    </div>
                    <strong>
                      {number(city.orders)}
                      <small>pedidos</small>
                    </strong>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="delivery-panel-empty">
                {busy ? (
                  <PitterSpinner label="Consultando cidades…" />
                ) : data ? (
                  "Nenhum destino nesta seleção."
                ) : (
                  "Os destinos aparecem após a consulta."
                )}
              </div>
            )}
            <button type="button" onClick={() => setSection("destinations")}>
              Explorar todos os destinos
              <ArrowUpRight size={14} />
            </button>
          </aside>
        </div>
      ) : (
        <section className="delivery-detail-card">
          <header>
            <div>
              <span>CONSULTA DOS DESTINOS</span>
              <h2>Cidades e quantidades</h2>
              <p>Dados do mesmo período e filtros do mapa.</p>
            </div>
            <span>
              {data
                ? `${number(cities.length)} cidades`
                : "Aguardando consulta"}
            </span>
          </header>
          {busy ? (
            <div className="delivery-panel-empty">
              <PitterSpinner label="Consultando destinos…" />
            </div>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Destino</th>
                    <th>País / UF</th>
                    <th>Pedidos</th>
                    <th>Unidades</th>
                  </tr>
                </thead>
                <tbody>
                  {cities
                    .slice((cityPage - 1) * 8, cityPage * 8)
                    .map((city, index) => (
                      <tr
                        key={`${city.country}-${city.state}-${city.city}-${index}`}
                      >
                        <td>
                          <strong>{city.city || "Cidade não informada"}</strong>
                        </td>
                        <td>
                          <span>
                            {countryFlag(city.country)}{" "}
                            {deliveryCountryName(city.country)}
                            {city.state ? ` · ${city.state}` : ""}
                          </span>
                        </td>
                        <td>{number(city.orders)}</td>
                        <td>{number(city.units)}</td>
                      </tr>
                    ))}
                  {!cities.length && (
                    <tr>
                      <td colSpan={4}>
                        {data
                          ? "Nenhum destino nesta seleção."
                          : "Não foi possível carregar os destinos."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {data && cities.length > 0 && (
            <TablePagination
              label="Páginas de cidades de destino"
              page={cityPage}
              pages={Math.ceil(cities.length / 8)}
              range={`${number((cityPage - 1) * 8 + 1)}–${number(Math.min(cityPage * 8, cities.length))} de ${number(cities.length)} cidades`}
              hasNext={cityPage * 8 < cities.length}
              onPrevious={() => setCityPage((value) => Math.max(1, value - 1))}
              onNext={() => setCityPage((value) => value + 1)}
            />
          )}
        </section>
      )}
      <footer className="delivery-context">
        <span>
          <Info size={14} />
          {data
            ? `${number(data.pickup)} retiradas no período · ${number(data.missing)} pedidos com destino incompleto na seleção`
            : "Aguardando os dados da seleção"}
        </span>
        <details>
          <summary>Sobre os dados</summary>
          <p>
            Pedidos pagos ou reembolsados, sem cancelados ou testes. Retiradas
            não entram no mapa. Atendimento concluído não comprova entrega ao
            cliente. O mapa mundial agrupa por país, e o mapa de cidades usa
            localização municipal aproximada, sem endereço individual. As
            cidades agrupadas como “não informada” continuam contabilizadas.
          </p>
        </details>
      </footer>
    </div>
  );
}
