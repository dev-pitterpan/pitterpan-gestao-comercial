"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./checkouts.module.css";

type Row = {
  id: string;
  name: string;
  date: string;
  complete: boolean;
  total: string;
  href: string | null;
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
  const visible = rows.filter(
    (row) =>
      row.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (status === "all" || row.complete === (status === "complete")),
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
      <p className={styles.count} role="status">
        {visible.length} de {rows.length} checkouts nesta página
      </p>
      {visible.length ? (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Checkout</th>
                <th>Criado em</th>
                <th>Situação</th>
                <th>Total</th>
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
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>
          {rows.length
            ? "Nenhum checkout corresponde à busca e à situação selecionada."
            : "Nenhum checkout encontrado neste período."}
        </p>
      )}
    </>
  );
}
