"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Navigation =
  | { hrefs: { previous?: string; next?: string } }
  | { hasNext: boolean; onPrevious: () => void; onNext: () => void };

export default function TablePagination(
  props: {
    label: string;
    page: number;
    pages?: number;
    range?: string;
    busy?: boolean;
  } & Navigation,
) {
  const { label, page, pages, range, busy = false } = props;
  const hasNext = "hrefs" in props ? Boolean(props.hrefs.next) : props.hasNext;
  if (page === 1 && !hasNext && !range) return null;

  function control(direction: "previous" | "next") {
    const previous = direction === "previous";
    const actionLabel = previous ? "Página anterior" : "Próxima página";
    const disabled = busy || (previous ? page === 1 : !hasNext);
    const content = previous ? (
      <>
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Anterior</span>
      </>
    ) : (
      <>
        <span>Próxima</span>
        <ChevronRight size={16} aria-hidden="true" />
      </>
    );
    const href = "hrefs" in props ? props.hrefs[direction] : undefined;

    if (href && !disabled)
      return (
        <Link
          className="admin-button"
          aria-label={actionLabel}
          href={href}
          scroll={false}
        >
          {content}
        </Link>
      );

    return (
      <button
        type="button"
        className="admin-button"
        aria-label={actionLabel}
        disabled={disabled}
        onClick={
          "hrefs" in props
            ? undefined
            : previous
              ? props.onPrevious
              : props.onNext
        }
      >
        {content}
      </button>
    );
  }

  return (
    <nav className="admin-table-pagination" aria-label={label} aria-busy={busy}>
      <span role="status">{busy ? "Atualizando resultados…" : range}</span>
      <div className="admin-table-pagination-controls">
        {control("previous")}
        <span aria-current="page" aria-live="polite">
          Página {page}
          {pages ? ` de ${pages}` : ""}
        </span>
        {control("next")}
      </div>
    </nav>
  );
}
