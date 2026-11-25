"use client";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { bentoCalendar, type BentoDay } from "../../lib/admin/bento-series";
export default function BentoActivity({
  rows,
  currency,
}: {
  rows: BentoDay[];
  currency: string;
}) {
  const data = bentoCalendar(rows);
  const [selected, setSelected] = useState<string | null>(null);
  const active = data.days.find((day) => day.day === selected);
  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
      value,
    );
  const date = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}`;
  return (
    <section
      className="bento-tile bento-activity"
      aria-label="Calendário de recebimentos"
    >
      <header>
        <div>
          <span className="bento-eyebrow">RITMO DA LOJA</span>
          <h2>Movimento por dia</h2>
        </div>
        <span className="bento-tag">
          <CalendarDays size={13} />
          {data.days.length} dias
        </span>
      </header>
      <p>
        {data.truncated
          ? "Últimos 35 dias da seleção"
          : "Todos os dias da seleção"}{" "}
        · valores por data do pedido
      </p>
      <div
        className="bento-calendar"
        role="group"
        aria-label="Valores recebidos por dia"
      >
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
          <span className="bento-weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: data.offset }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {data.days.map((day) => (
          <button
            key={day.day}
            type="button"
            data-level={day.level}
            aria-pressed={selected === day.day}
            aria-label={`${date(day.day)}: ${day.value === null ? "Sem dados" : money(day.value)}`}
            title={`${date(day.day)} · ${day.value === null ? "Sem dados" : money(day.value)}`}
            onClick={() => setSelected(day.day)}
            onFocus={() => setSelected(day.day)}
          >
            {day.day.slice(8, 10)}
          </button>
        ))}
      </div>
      <footer>
        <span aria-live="polite">
          {active
            ? `${date(active.day)} · ${active.value === null ? "Sem dados" : money(active.value)}`
            : "Selecione um dia para consultar"}
        </span>
        <span className="bento-intensity-key">
          Menor <i />
          <i />
          <i />
          <i /> Maior
        </span>
      </footer>
    </section>
  );
}
