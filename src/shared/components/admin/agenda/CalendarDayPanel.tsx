"use client";
import {
  CalendarDays,
  Clock3,
  Plus,
  Video,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import type { Appointment, Supplier } from "../../../lib/agenda/types";
import type { Occasion } from "../../../lib/agenda/occasions";
import { calendarEventTime } from "../../../lib/agenda/calendar";
import { occasionTheme } from "../../../lib/agenda/occasion-theme";
import { occasionLabels } from "./OccasionEditor";
export const appointmentLabels = {
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
};
export default function CalendarDayPanel({
  day,
  today,
  appointments,
  dates,
  suppliers,
  busy,
  onCreate,
  onAppointment,
  onOccasion,
  onSelect,
  nextDates,
}: {
  day: string;
  today: string;
  appointments: Appointment[];
  dates: Occasion[];
  suppliers: Supplier[];
  busy: boolean;
  onCreate: () => void;
  onAppointment: (event: Appointment) => void;
  onOccasion: (event: Occasion) => void;
  onSelect: (day: string) => void;
  nextDates: Occasion[];
}) {
  const current = new Date(`${day}T12:00:00Z`);
  return (
    <aside
      className="agenda-premium-rail"
      aria-label="Detalhes do dia selecionado"
    >
      <section className="agenda-premium-day-panel">
        <header>
          <span className="agenda-premium-overline">
            {day === today ? "HOJE NA SUA AGENDA" : "DIA SELECIONADO"}
          </span>
          <span className="agenda-premium-timezone">Brasília</span>
        </header>
        <div className="agenda-premium-selected-date" aria-live="polite">
          <strong>{Number(day.slice(-2))}</strong>
          <div>
            <h3>
              {new Intl.DateTimeFormat("pt-BR", {
                weekday: "long",
                timeZone: "UTC",
              }).format(current)}
            </h3>
            <span>
              {new Intl.DateTimeFormat("pt-BR", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(current)}
            </span>
          </div>
        </div>
        <div className="agenda-premium-day-meta">
          <span>
            {appointments.length}{" "}
            {appointments.length === 1 ? "compromisso" : "compromissos"}
          </span>
          <span>
            {dates.length}{" "}
            {dates.length === 1 ? "data importante" : "datas importantes"}
          </span>
        </div>
        {!!dates.length && (
          <div className="agenda-premium-date-cards">
            {dates.map((item) => (
              <button
                type="button"
                key={item.id}
                disabled={busy}
                className={`agenda-premium-date-card ${item.kind}${item.hidden ? " is-hidden" : ""}`}
                onClick={() => onOccasion(item)}
              >
                <span className="agenda-premium-date-symbol" aria-hidden="true">
                  {occasionTheme(item).symbol}
                </span>
                <span>
                  <small>
                    {occasionLabels[item.kind]}
                    {item.hidden ? " · Oculta" : ""}
                  </small>
                  <strong>{item.title}</strong>
                  {item.notes && (
                    <span className="agenda-premium-date-note">
                      {item.notes}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
        {appointments.length ? (
          <ol className="agenda-premium-timeline">
            {appointments.map((item) => (
              <li key={item.id} className={`is-${item.status}`}>
                <time>
                  {calendarEventTime(item.starts_at, item.ends_at, day).start}
                </time>
                <div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onAppointment(item)}
                  >
                    <strong>{item.title}</strong>
                    <span>
                      {suppliers.find((s) => s.id === item.supplier_id)?.name ||
                        "Compromisso da equipe"}
                    </span>
                  </button>
                  <span className="agenda-premium-timeline-meta">
                    <span className={`agenda-premium-status ${item.status}`}>
                      {item.status === "completed" ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <Clock3 size={11} />
                      )}{" "}
                      {appointmentLabels[item.status]}
                    </span>
                    <span>
                      até{" "}
                      {calendarEventTime(item.starts_at, item.ends_at, day).end}
                    </span>
                  </span>
                  {item.location && (
                    <span className="agenda-premium-location">
                      <MapPin size={12} />
                      {item.location}
                    </span>
                  )}
                  {item.video_url && item.status !== "cancelled" && (
                    <a
                      href={`/gestor/reunioes/${item.id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video size={13} />
                      Abrir reunião
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="agenda-premium-free">
            <Clock3 size={23} />
            <strong>Um espaço para planejar</strong>
            <p>Nenhum compromisso neste dia.</p>
          </div>
        )}
        <button
          type="button"
          className="agenda-premium-new-day"
          disabled={busy}
          onClick={onCreate}
        >
          <Plus size={16} />
          Agendar neste dia
        </button>
      </section>
      <section className="agenda-premium-next">
        <header>
          <CalendarDays size={16} />
          <h3>No restante do mês</h3>
        </header>
        {nextDates.length ? (
          <ul>
            {nextDates.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onSelect(item.event_date)}
                >
                  <span>
                    {Number(item.event_date.slice(-2))}
                    <small>
                      {new Intl.DateTimeFormat("pt-BR", {
                        month: "short",
                        timeZone: "UTC",
                      })
                        .format(new Date(`${item.event_date}T12:00:00Z`))
                        .replace(".", "")}
                    </small>
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{occasionLabels[item.kind]}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Sem outras datas importantes neste mês.</p>
        )}
      </section>
    </aside>
  );
}
