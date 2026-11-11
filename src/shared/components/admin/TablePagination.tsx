"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TablePagination({
  label,
  page,
  pages,
  range,
  hasNext,
  busy = false,
  onPrevious,
  onNext,
}: {
  label: string;
  page: number;
  pages?: number;
  range?: string;
  hasNext: boolean;
  busy?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (page === 1 && !hasNext && !range) return null;
  return (
    <nav className="admin-table-pagination" aria-label={label} aria-busy={busy}>
      <span role="status">{busy ? "Atualizando resultados…" : range}</span>
      <div className="admin-table-pagination-controls">
        <button
          type="button"
          className="admin-button"
          disabled={busy || page === 1}
          aria-label="Página anterior"
          onClick={onPrevious}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span>Anterior</span>
        </button>
        <span aria-current="page" aria-live="polite">
          Página {page}
          {pages ? ` de ${pages}` : ""}
        </span>
        <button
          type="button"
          className="admin-button"
          disabled={busy || !hasNext}
          aria-label="Próxima página"
          onClick={onNext}
        >
          <span>Próxima</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
