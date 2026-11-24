"use client";
import { PageHeading } from "./Primitives";
import { useEffect, useState } from "react";
import AdminSelect from "./AdminSelect";
import DateRangePicker from "./DateRangePicker";
import type { DateRange } from "../../lib/admin/date-range";
import PitterSpinner from "./PitterSpinner";
import DeliveryMark from "./DeliveryMark";
import DeliveryMapView from "./DeliveryMapView";
import TablePagination from "./TablePagination";
import { deliveryLabels } from "../../lib/admin/delivery";
import type { readDestinations } from "../../server/sales/destinations";
type Data = Awaited<ReturnType<typeof readDestinations>>;
const number = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
export default function DestinationsDashboard() {
  const [mapView, setMapView] = useState<"regions" | "cities">("regions");
  const [range, setRange] = useState<DateRange>({ start: "", end: "" });
  const [days, setDays] = useState("30"),
    [delivery, setDelivery] = useState("all"),
    [fulfillment, setFulfillment] = useState("all"),
    [state, setState] = useState(""),
    [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [cityPage, setCityPage] = useState(1),
    [data, setData] = useState<Data | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(q), 400);
    return () => clearTimeout(timer);
  }, [q]);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setData(null);
    setError("");
    setCityPage(1);
    const params = new URLSearchParams({
      days,
      start: range.start,
      end: range.end,
      delivery,
      fulfillment,
      state,
      q: search,
    });
    void fetch(`/api/admin/destinations/?${params}`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      cache: "no-store",
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
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
  }, [days, delivery, fulfillment, state, search, range.start, range.end]);

  return (
    <>
      <PageHeading
        title="Mapa de entregas"
        description="Consulte os destinos dos pedidos por período, modalidade e situação."
        filters={
          <div className="insights-filters">
            <AdminSelect
              label="Período dos destinos"
              value={days}
              onValueChange={(v) => {
                setDays(v);
                setRange({ start: "", end: "" });
              }}
              options={[7, 30, 60].map((n) => ({
                value: String(n),
                label: `Últimos ${n} dias`,
              }))}
            />
            <DateRangePicker value={range} onChange={setRange} />
            <AdminSelect
              label="Entrega"
              value={delivery}
              onValueChange={setDelivery}
              options={[
                { value: "all", label: "Todas as entregas" },
                { value: "PICKUP", label: deliveryLabels.PICKUP },
                { value: "MOTOBOY", label: "Motoboy" },
                { value: "SEDEX", label: "Sedex" },
                { value: "PAC", label: deliveryLabels.PAC },
                { value: "JADLOG", label: deliveryLabels.JADLOG },
                { value: "LOCAL", label: deliveryLabels.LOCAL },
                { value: "OTHER", label: deliveryLabels.OTHER },
                { value: "MIXED", label: "Modalidades múltiplas" },
                { value: "UNKNOWN", label: "Não identificado" },
              ]}
            />
            <AdminSelect
              label="Situação do atendimento"
              value={fulfillment}
              onValueChange={setFulfillment}
              options={[
                { value: "all", label: "Todo atendimento" },
                { value: "FULFILLED", label: "Atendimento concluído" },
                { value: "PARTIALLY_FULFILLED", label: "Atendimento parcial" },
                { value: "UNFULFILLED", label: "Atendimento pendente" },
              ]}
            />
            <AdminSelect
              label="Estado de destino"
              value={state}
              onValueChange={setState}
              options={[
                { value: "", label: "Todos os estados" },
                ..."AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO"
                  .split(" ")
                  .map((uf) => ({ value: uf, label: uf })),
              ]}
            />
            <input
              aria-label="Buscar cidade ou estado"
              placeholder="Cidade ou estado…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {state && (
              <button className="admin-button" onClick={() => setState("")}>
                Limpar estado · {state}
              </button>
            )}
          </div>
        }
      />
      {busy && <PitterSpinner label="Consultando destinos…" />}
      {error && (
        <p className="admin-data-notice" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <div className="admin-mini-stats">
            {[
              ["Pedidos de entrega", data.total],
              ["Retiradas no período", data.pickup],
              ["Destinos incompletos", data.missing],
              ["Internacionais", data.international],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <span>{label}</span>
                <strong>{number(Number(value))}</strong>
              </div>
            ))}
          </div>
          <p className="sales-definition">
            Destinos de pedidos pagos ou reembolsados, com cancelados e testes
            excluídos. Atendimento concluído na Shopify não comprova entrega ao
            cliente. Retiradas não entram no mapa. Datas personalizadas usam o
            horário de Brasília. Cidades e quantidades são da seleção; o mapa e
            a tabela seguem os mesmos filtros.
          </p>
          {data.missing > 0 && (
            <p className="admin-data-notice">
              Há {number(data.missing)} pedidos sem destino completo. Releia os
              detalhes dos pedidos e confira a permissão de endereço do app.
              Esses pedidos permanecem contabilizados como não informados.
            </p>
          )}
          <div className="delivery-destinations-layout">
            <section className="admin-panel">
              <DeliveryMapView
                cities={data.cities}
                state={state}
                onStateChange={setState}
                view={mapView}
                onViewChange={setMapView}
              />
              {state && (
                <p className="delivery-selected-state" role="status">
                  Estado selecionado: <strong>{state}</strong>
                  <button type="button" onClick={() => setState("")}>
                    Ver todos os estados
                  </button>
                </p>
              )}
            </section>
            <section className="admin-panel">
              <header>
                <h2>Cidades e quantidades {state && `· ${state}`}</h2>
              </header>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Destino</th>
                      <th>Pedidos</th>
                      <th>Unidades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cities
                      .slice((cityPage - 1) * 8, cityPage * 8)
                      .map((row, i) => (
                        <tr
                          key={`${row.country}-${row.state}-${row.city}-${i}`}
                        >
                          <td>
                            <strong>
                              {row.city || "Cidade não informada"}
                            </strong>
                            <small>
                              {[row.state, row.country]
                                .filter(Boolean)
                                .join(" · ") || "Destino não informado"}
                            </small>
                          </td>
                          <td>{number(row.orders)}</td>
                          <td>{number(row.units)}</td>
                        </tr>
                      ))}
                    {!data.cities.length && (
                      <tr>
                        <td colSpan={3}>Nenhum destino nesta seleção.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {data.cities.length > 0 && (
                <TablePagination
                  label="Páginas de cidades de destino"
                  page={cityPage}
                  pages={Math.max(1, Math.ceil(data.cities.length / 8))}
                  range={`${number((cityPage - 1) * 8 + 1)}–${number(Math.min(cityPage * 8, data.cities.length))} de ${number(data.cities.length)} cidades`}
                  hasNext={cityPage * 8 < data.cities.length}
                  onPrevious={() =>
                    setCityPage((page) => Math.max(1, page - 1))
                  }
                  onNext={() => setCityPage((page) => page + 1)}
                />
              )}
              {delivery !== "all" && (
                <div className="sales-pagination">
                  <DeliveryMark kind={delivery} />
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
