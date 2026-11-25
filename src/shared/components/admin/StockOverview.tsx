"use client";

import Link from "next/link";
import InfographicRadial from "./InfographicRadial";
import { chartColors } from "../../lib/admin/chart-style";
import { useState } from "react";
import type { AdminSummary } from "../../server/admin/repository";

const number = (value: number) => value.toLocaleString("pt-BR");
export default function StockOverview({
  summary,
  low,
}: {
  summary: AdminSummary | null;
  low: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!summary)
    return (
      <p className="admin-inline-note">
        O resumo do estoque ficará disponível após a importação.
      </p>
    );
  const segments = [
    {
      label: "Acima do estoque baixo",
      value: Math.max(
        0,
        summary.variants - summary.low - summary.out - summary.unknown,
      ),
      color: "#6999bd",
      href: "/gestor/estoque/?stock=above",
    },
    {
      label: "Estoque baixo",
      value: summary.low,
      color: "#286da8",
      href: "/gestor/estoque/?stock=low",
    },
    {
      label: "Sem estoque",
      value: summary.out,
      color: chartColors.coral,
      href: "/gestor/estoque/?stock=out",
    },
    {
      label: "Não informado",
      value: summary.unknown,
      color: chartColors.slate,
      href: "/gestor/estoque/?stock=unknown",
    },
  ];
  const current = selected === null ? null : segments[selected];
  return (
    <div className="infographic-stock">
      <InfographicRadial
        items={segments}
        total={summary.variants}
        label="Distribuição das variantes por situação do estoque"
        format={(value) => (value === null ? "—" : number(value))}
        selected={selected}
        onSelect={setSelected}
      />
      <p className="admin-inline-note">
        Baixo: de 1 a {low} unidades por variante. Quantidades da última
        publicação do catálogo.
      </p>
      <Link
        className="admin-text-link"
        href={current?.href || "/gestor/estoque/"}
      >
        {current
          ? `Conferir: ${current.label.toLowerCase()}`
          : "Explorar estoque completo"}{" "}
        →
      </Link>
    </div>
  );
}
