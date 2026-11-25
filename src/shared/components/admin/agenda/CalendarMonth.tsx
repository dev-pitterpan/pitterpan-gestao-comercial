"use client";
import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import {
  calendarKeyboardDay,
  localTime,
  calendarEventTime,
  overlapsDay,
} from "../../../lib/agenda/calendar";
import type { Appointment } from "../../../lib/agenda/types";
import type { Occasion } from "../../../lib/agenda/occasions";
import OccasionChip from "./OccasionChip";
export default function CalendarMonth({
  days,
  month,
  day,
  today,
  events,
  dates,
  disabled,
  onSelect,
  onCreate,
  onAppointment,
  onOccasion,
}: {
  days: string[];
  month: string;
  day: string;
  today: string;
  events: Appointment[];
  dates: Occasion[];
  disabled: boolean;
  onSelect: (day: string) => void;
  onCreate: (day: string) => void;
  onAppointment: (event: Appointment, day: string) => void;
  onOccasion: (event: Occasion) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    if (!disabled && pendingFocus.current) {
      root.current
        ?.querySelector<HTMLButtonElement>(
          `[data-calendar-date="${pendingFocus.current}"]`,
        )
        ?.focus();
      pendingFocus.current = null;
    }
  }, [day, month, disabled]);
  return (
    <div className="agenda-premium-month" ref={root}>
      <div className="agenda-premium-weekdays" aria-hidden="true">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div
        className="agenda-premium-grid"
        role="group"
        aria-label="Dias do mês. Use as setas para navegar e Enter para selecionar."
      >
        {days.map((date, index) => {
          const rows = events
            .filter((event) =>
              overlapsDay(event.starts_at, event.ends_at, date),
            )
            .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
          const occasions = dates.filter((item) => item.event_date === date);
          const hidden =
            Math.max(0, rows.length - 2) + Math.max(0, occasions.length - 2);
          const label = new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "full",
            timeZone: "UTC",
          }).format(new Date(`${date}T12:00:00Z`));
          return (
            <div
              key={date}
              className={`agenda-premium-cell${date.startsWith(month) ? "" : " is-outside"}${day === date ? " is-selected" : ""}${index % 7 === 0 || index % 7 === 6 ? " is-weekend" : ""}`}
            >
              <div className="agenda-premium-cell-top">
                <button
                  type="button"
                  data-calendar-date={date}
                  className={`agenda-premium-day${date === today ? " is-today" : ""}`}
                  aria-label={`${label}. ${rows.length} compromissos e ${occasions.length} datas importantes.`}
                  aria-current={date === today ? "date" : undefined}
                  aria-pressed={day === date}
                  tabIndex={date === day ? 0 : -1}
                  disabled={disabled}
                  onClick={() => onSelect(date)}
                  onKeyDown={(event) => {
                    if (event.altKey || event.ctrlKey || event.metaKey) return;
                    const next = calendarKeyboardDay(date, event.key);
                    if (next) {
                      event.preventDefault();
                      pendingFocus.current = next;
                      onSelect(next);
                    }
                  }}
                >
                  {Number(date.slice(-2))}
                </button>
                <button
                  type="button"
                  className="agenda-premium-day-add"
                  aria-label={`Novo compromisso em ${label}`}
                  tabIndex={-1}
                  disabled={disabled}
                  onClick={() => onCreate(date)}
                >
                  <Plus size={13} />
                </button>
              </div>
              <div className="agenda-premium-cell-events">
                {occasions.slice(0, 2).map((item) => (
                  <OccasionChip
                    key={item.id}
                    item={item}
                    onEdit={() => onOccasion(item)}
                  />
                ))}
                {rows.slice(0, 2).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`agenda-premium-event ${item.status}`}
                    title={`${localTime(item.starts_at)} · ${item.title}`}
                    disabled={disabled}
                    onClick={() => onAppointment(item, date)}
                  >
                    <time>
                      {
                        calendarEventTime(item.starts_at, item.ends_at, date)
                          .start
                      }
                    </time>
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
              {hidden > 0 && (
                <button
                  type="button"
                  className="agenda-premium-more"
                  disabled={disabled}
                  onClick={() => onSelect(date)}
                >
                  +{hidden} <span>neste dia</span>
                </button>
              )}
              {!!(rows.length + occasions.length) && (
                <div className="agenda-premium-mobile-dots" aria-hidden="true">
                  {!!occasions.length && <i className={occasions[0].kind} />}{" "}
                  {!!rows.length && <i className="meeting" />}
                  <span>{rows.length + occasions.length}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
