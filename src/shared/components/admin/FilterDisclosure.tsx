"use client";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
const labels: Record<string, string> = {
  q: "Busca",
  category: "Categoria",
  vendor: "Marca",
  stock: "Estoque",
  delivery: "Entrega",
  status: "Pagamento",
  fulfillment: "Atendimento",
  kind: "Tipo",
  start: "De",
  end: "Até",
};
/** Native details keeps every form field mounted and submitted, even when collapsed. */
export default function FilterDisclosure({
  children,
}: {
  children: ReactNode;
}) {
  const params = useSearchParams();
  const active = [...params].filter(
    ([key, value]) => labels[key] && value && value !== "all",
  );
  return (
    <details className="content-filter-disclosure">
      <summary>
        <SlidersHorizontal size={16} />
        <span>Filtros da consulta</span>
        {active.length > 0 && <b>{active.length}</b>}
        <ChevronDown size={15} />
      </summary>
      <div className="content-filter-body">
        <div className="content-filter-intro">
          <strong>Refine a seleção</strong>
          <span>Os resultados acompanham os critérios escolhidos.</span>
        </div>
        {children}
      </div>
    </details>
  );
}
