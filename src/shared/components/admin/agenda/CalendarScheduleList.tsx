"use client";
import { CalendarDays, Clock3, Plus } from "lucide-react";
import { calendarEventTime, overlapsDay } from "../../../lib/agenda/calendar";
import type { Appointment } from "../../../lib/agenda/types";
import type { Occasion } from "../../../lib/agenda/occasions";
import { occasionTheme } from "../../../lib/agenda/occasion-theme";
import { occasionLabels } from "./OccasionEditor";
export default function CalendarScheduleList({
  days,
  month,
  events,
  dates,
  busy,
  onAppointment,
  onOccasion,
  onCreate,
}: {
  days: string[];
  month: string;
  events: Appointment[];
  dates: Occasion[];
  busy: boolean;
  onAppointment: (item: Appointment, day: string) => void;
  onOccasion: (item: Occasion) => void;
  onCreate: (day: string) => void;
}) {
  const groups = days
    .filter((day) => day.startsWith(month))
    .map((day) => ({
      day,
      events: events
        .filter((item) => overlapsDay(item.starts_at, item.ends_at, day))
        .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at)),
      dates: dates.filter((item) => item.event_date === day),
    }))
    .filter((group) => group.events.length || group.dates.length);
  return (
    <div
      className="agenda-premium-list"
      aria-label="Compromissos e datas do mês em lista"
    >
      {groups.length ? (
        groups.map((group) => (
          <section key={group.day}>
            <header>
              <time dateTime={group.day}>
                <strong>{Number(group.day.slice(-2))}</strong>
                <span>
                  {new Intl.DateTimeFormat("pt-BR", {
                    weekday: "short",
                    month: "short",
                    timeZone: "UTC",
                  }).format(new Date(`${group.day}T12:00:00Z`))}
                </span>
              </time>
              <button
                type="button"
                className="agenda-icon-button"
                disabled={busy}
                aria-label={`Agendar em ${group.day.split("-").reverse().join("/")}`}
                onClick={() => onCreate(group.day)}
              >
                <Plus size={15} />
              </button>
            </header>
            <div>
              {group.dates.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`agenda-premium-list-row ${item.kind}`}
                  disabled={busy}
                  onClick={() => onOccasion(item)}
                >
                  <span aria-hidden="true">{occasionTheme(item).symbol}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {occasionLabels[item.kind]}
                      {item.hidden ? " · Oculta" : ""}
                    </small>
                  </span>
                  <time>Dia inteiro</time>
                </button>
              ))}
              {group.events.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`agenda-premium-list-row meeting ${item.status}`}
                  disabled={busy}
                  onClick={() => onAppointment(item, group.day)}
                >
                  <Clock3 size={19} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.status === "completed"
                        ? "Concluído"
                        : "Compromisso agendado"}
                    </small>
                  </span>
                  <time>
                    {
                      calendarEventTime(item.starts_at, item.ends_at, group.day)
                        .start
                    }
                    –
                    {
                      calendarEventTime(item.starts_at, item.ends_at, group.day)
                        .end
                    }
                  </time>
                </button>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="agenda-premium-list-empty">
          <CalendarDays size={36} />
          <h3>Seu mês, pronto para planejar</h3>
          <p>Os compromissos e as datas importantes deste mês aparecem aqui.</p>
          <button
            type="button"
            className="agenda-premium-primary"
            disabled={busy}
            onClick={() => onCreate(`${month}-01`)}
          >
            <Plus size={16} />
            Novo compromisso
          </button>
        </div>
      )}
    </div>
  );
}
