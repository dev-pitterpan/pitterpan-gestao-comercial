"use client";

import TablePagination from "./TablePagination";
import { useEffect, useState } from "react";

const endpoint = "/api/admin/catalog-images/";
const labels = {
  pending: "Pendente",
  completed: "Convertida",
  failed: "Falhou",
};
type Photo = {
  source: string;
  sku: string;
  name: string;
  status: keyof typeof labels;
  active: boolean;
  original_format: string | null;
  original_width: number | null;
  original_height: number | null;
  original_bytes: number | null;
  webp_bytes: number | null;
  processed_at: string | null;
  error: string | null;
};
const bytes = (value: number | null) =>
  value === null
    ? "—"
    : `${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`;

export default function CatalogImages() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ images: Photo[]; more: boolean }>({
    images: [],
    more: false,
  });
  const [selection, setSelection] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [revision, refresh] = useState(0);
  const [period, setPeriod] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({
      q: query,
      status,
      page: String(page),
      days: period,
    });
    void fetch(`${endpoint}?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setData(result);
        setSelection([]);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, status, page, period, revision]);

  async function convert(all = false) {
    setWorking(true);
    setError("");
    let converted = 0;
    let failed = 0;
    try {
      let more = false;
      const batches = all
        ? [undefined]
        : Array.from({ length: Math.ceil(selection.length / 12) }, (_, i) =>
            selection.slice(i * 12, (i + 1) * 12),
          );
      for (const sources of batches) {
        do {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sources }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          converted += result.converted;
          failed += result.failed;
          more = result.more;
          setMessage(`${converted} convertidas · ${failed} com erro`);
        } while (more);
      }
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Falha no processamento.",
      );
    } finally {
      setWorking(false);
      refresh((value) => value + 1);
    }
  }

  const selectable = data.images
    .filter((photo) => photo.active && photo.status !== "completed")
    .map((photo) => photo.source);
  return (
    <section className="admin-panel" aria-busy={loading || working}>
      <form
        className="admin-settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <label>
          Produto ou SKU{" "}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
          />
        </label>
        <label>
          Situação{" "}
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="">Todas</option>
            {Object.entries(labels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Processamento{" "}
          <select
            value={period}
            onChange={(event) => {
              setPage(1);
              setPeriod(event.target.value);
            }}
          >
            <option value="">Todo o período</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </label>
        <button className="admin-button" type="submit">
          Buscar
        </button>
      </form>
      <div className="admin-profile-photo-actions">
        <button
          className="admin-button"
          disabled={loading || working || !selectable.length}
          onClick={() => setSelection(selectable)}
        >
          Selecionar pendentes e falhas da página
        </button>
        <button
          className="admin-button"
          disabled={loading || working}
          onClick={() => void convert(true)}
        >
          Converter todas as pendentes
        </button>
        <button
          className="admin-button admin-button-primary"
          disabled={loading || working || !selection.length}
          onClick={() => void convert()}
        >
          Converter seleção ({selection.length})
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Selecionar</th>
              <th scope="col">Foto e produto</th>
              <th scope="col">Original</th>
              <th scope="col">WebP</th>
              <th scope="col">Economia</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            {data.images.map((photo) => (
              <tr key={photo.source}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar foto de ${photo.name}`}
                    checked={selection.includes(photo.source)}
                    disabled={
                      working ||
                      loading ||
                      !photo.active ||
                      photo.status === "completed"
                    }
                    onChange={(event) =>
                      setSelection((values) =>
                        event.target.checked
                          ? [...values, photo.source]
                          : values.filter((source) => source !== photo.source),
                      )
                    }
                  />
                </td>
                <td>
                  <strong>{photo.name}</strong>
                  <small>
                    SKU {photo.sku} ·{" "}
                    {photo.active ? "No catálogo" : "Histórico"}
                  </small>
                  <a href={photo.source} target="_blank" rel="noreferrer">
                    Ver original
                  </a>
                  {photo.webp_bytes && (
                    <a
                      href={`${endpoint}?source=${encodeURIComponent(photo.source)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {" · Ver WebP"}
                    </a>
                  )}
                </td>
                <td>
                  {photo.original_format
                    ? `${photo.original_format.toUpperCase()} · ${photo.original_width} × ${photo.original_height} px`
                    : "—"}
                  <small>{bytes(photo.original_bytes)}</small>
                </td>
                <td>
                  {photo.webp_bytes ? "WebP · 1000 × 1000 px" : "—"}
                  <small>{bytes(photo.webp_bytes)}</small>
                </td>
                <td>
                  {photo.original_bytes && photo.webp_bytes
                    ? `${Math.round((1 - photo.webp_bytes / photo.original_bytes) * 100)}%`
                    : "—"}
                </td>
                <td>
                  {labels[photo.status]}
                  {photo.processed_at && (
                    <small>
                      {new Date(photo.processed_at).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </small>
                  )}
                  {photo.error && <small>{photo.error}</small>}
                </td>
              </tr>
            ))}
            {!loading && !data.images.length && (
              <tr>
                <td colSpan={6}>Nenhuma foto encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        label="Páginas de imagens do catálogo"
        page={page}
        hasNext={data.more}
        busy={loading || working}
        onPrevious={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
      />
    </section>
  );
}
