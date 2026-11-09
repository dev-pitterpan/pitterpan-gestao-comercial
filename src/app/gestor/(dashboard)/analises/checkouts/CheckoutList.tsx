"use client";

import Link from "next/link";
import AdminSelect from "@shared/components/admin/AdminSelect";
import { useState } from "react";
import styles from "./checkouts.module.css";

type Row = {
  id: string;
  name: string;
  date: string;
  complete: boolean;
  total: string;
  href: string | null;
  timestamp: number;
  city: string;
  methods: string[];
  shippingPrice: string;
  shippingAmount: number | null;
  shippingCurrency: string;
  totalAmount: number;
  currency: string;
};

const filters = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Em aberto" },
  { value: "complete", label: "Concluídos" },
] as const;

export function CheckoutList({
  rows,
  selectedId,
}: {
  rows: Row[];
  selectedId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] =
    useState<(typeof filters)[number]["value"]>("all");
  const [city, setCity] = useState("");
  const [method, setMethod] = useState("");
  const [minimum, setMinimum] = useState("");
  const [sort, setSort] = useState<{
    key: "timestamp" | "shippingAmount" | "totalAmount";
    ascending: boolean;
  }>({ key: "timestamp", ascending: false });
  const cities = new Map<string, string>();
  for (const { city } of rows) {
    if (!city) continue;
    const value = city.toLocaleLowerCase("pt-BR");
    if (!cities.has(value) || city !== city.toLocaleUpperCase("pt-BR")) {
      cities.set(value, city);
    }
  }
  const destinations = [...cities].sort(([, a], [, b]) =>
    a.localeCompare(b, "pt-BR"),
  );
  const methods = [...new Set(rows.flatMap((row) => row.methods))].sort();
  const visible = rows
    .filter(
      (row) =>
        row.name
          .toLowerCase()
          .replace(/^#/, "")
          .includes(query.trim().toLowerCase().replace(/^#/, "")) &&
        (status === "all" || row.complete === (status === "complete")) &&
        (!city || row.city.toLocaleLowerCase("pt-BR") === city) &&
        (!method || row.methods.includes(method)) &&
        (!minimum ||
          (row.shippingCurrency === "BRL" &&
            row.shippingAmount !== null &&
            row.shippingAmount >= Number(minimum))),
    )
    .sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      if (left === null || right === null)
        return Number(left === null) - Number(right === null);
      const currency =
        sort.key === "shippingAmount"
          ? a.shippingCurrency.localeCompare(b.shippingCurrency)
          : sort.key === "totalAmount"
            ? a.currency.localeCompare(b.currency)
            : 0;
      return currency || (left - right) * (sort.ascending ? 1 : -1);
    });
  const sortable = (key: typeof sort.key, label: string) => (
    <th
      scope="col"
      aria-sort={
        sort.key === key
          ? sort.ascending
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      <button
        type="button"
        className={styles.sortButton}
        onClick={() =>
          setSort({ key, ascending: sort.key === key && !sort.ascending })
        }
      >
        {label}{" "}
        <span aria-hidden="true">
          {sort.key === key ? (sort.ascending ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );

  return (
    <>
      <div className={styles.controls}>
        <div
          role="group"
          aria-label="Situação nesta página"
          className={styles.period}
        >
          {filters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              className={styles.button}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className={styles.search}>
          <span>Buscar nesta página</span>
          <input
            type="search"
            placeholder="Número do checkout"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className={styles.filters}>
        <div className={styles.search}>
          <span>Destino</span>
          <AdminSelect
            label="Destino"
            value={city}
            onValueChange={setCity}
            options={[
              { value: "", label: "Todos os destinos" },
              ...destinations.map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
        <div className={styles.search}>
          <span>Modalidade</span>
          <AdminSelect
            label="Modalidade"
            value={method}
            onValueChange={setMethod}
            options={[
              { value: "", label: "Todas as modalidades" },
              ...methods.map((value) => ({ value, label: value })),
            ]}
          />
        </div>
        <label className={styles.search}>
          Frete mínimo (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
          />
        </label>
      </div>
      <p className={styles.count}>
        Busca, destino, modalidade e frete filtram os checkouts da página
        aberta. Use a paginação para consultar os demais registros do período.
      </p>
      <p className={styles.count} role="status">
        {visible.length} de {rows.length} checkouts nesta página
      </p>
      {visible.length ? (
        <div
          className={`${styles.scroll} ${styles.sheet}`}
          role="region"
          aria-label="Tabela de checkouts"
          tabIndex={0}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Checkout</th>
                {sortable("timestamp", "Criado em")}
                <th>Situação</th>
                <th>Destino</th>
                {sortable("shippingAmount", "Frete")}
                {sortable("totalAmount", "Total")}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  data-selected={
                    row.id === `gid://shopify/AbandonedCheckout/${selectedId}`
                  }
                >
                  <td>
                    {row.href ? (
                      <Link
                        className={styles.checkoutLink}
                        href={row.href}
                        prefetch={false}
                        aria-current={
                          row.id ===
                          `gid://shopify/AbandonedCheckout/${selectedId}`
                            ? "true"
                            : undefined
                        }
                      >
                        {row.name} <span aria-hidden="true">›</span>
                      </Link>
                    ) : (
                      row.name
                    )}
                  </td>
                  <td>{row.date}</td>
                  <td>
                    <span
                      className={row.complete ? styles.complete : styles.open}
                    >
                      {row.complete ? "Concluído" : "Em aberto"}
                    </span>
                  </td>
                  <td>{row.city || "—"}</td>
                  <td>
                    <strong>{row.shippingPrice}</strong>
                    {row.methods.length > 0 && (
                      <small className={styles.method}>
                        {row.methods.join(" · ")}
                      </small>
                    )}
                  </td>
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>
          {rows.length
            ? "Nenhum checkout corresponde aos filtros selecionados."
            : "Nenhum checkout encontrado neste período."}
        </p>
      )}
    </>
  );
}
