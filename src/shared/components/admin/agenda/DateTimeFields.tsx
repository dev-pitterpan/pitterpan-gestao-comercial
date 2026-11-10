"use client";
import { useState, useId, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import AdminSelect from "../AdminSelect";
import useDatePopover from "../useDatePopover";
import { todayDate } from "../../../lib/admin/date-range";
import { monthDays, monthShift } from "../../../lib/agenda/calendar";
export function AgendaDateField({
  name,
  label,
  initial,
  disabled = false,
}: {
  name: string;
  label: string;
  initial: string;
  disabled?: boolean;
}) {
  const today = todayDate();
  const [value, setValue] = useState(initial),
    [open, setOpen] = useState(false),
    [month, setMonth] = useState((initial || today).slice(0, 7));
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useDatePopover(open, trigger, panel, 320);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      className="agenda-date-field"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.stopPropagation();
          close();
        }
      }}
    >
      <label htmlFor={`${id}-trigger`}>{label}</label>
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        id={`${id}-trigger`}
        type="button"
        className="agenda-date-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={id}
        disabled={disabled}
        onClick={() => {
          if (!open) setMonth((value || today).slice(0, 7));
          setOpen(!open);
        }}
      >
        <CalendarDays size={16} />
        {value ? value.split("-").reverse().join("/") : "Escolher data"}
      </button>
      {open && (
        <div
          className="admin-date-popover admin-date-popover--single"
          ref={panel}
          popover="manual"
          id={id}
          role="dialog"
          aria-label={`Escolher ${label.toLowerCase()}`}
        >
          <div className="admin-date-months">
            <section>
              <button
                type="button"
                className="admin-date-nav admin-date-nav--previous"
                aria-label="Mês anterior"
                onClick={() => setMonth(monthShift(month, -1))}
              >
                <ChevronLeft size={16} />
              </button>
              <h3>
                {new Intl.DateTimeFormat("pt-BR", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${month}-01T12:00:00Z`))}
              </h3>
              <button
                type="button"
                className="admin-date-nav admin-date-nav--next"
                aria-label="Próximo mês"
                onClick={() => setMonth(monthShift(month, 1))}
              >
                <ChevronRight size={16} />
              </button>
              <div className="admin-calendar-grid">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                  (d, i) => (
                    <span key={i}>{d}</span>
                  ),
                )}
                {monthDays(month).map((day) => (
                  <button
                    type="button"
                    key={day}
                    className={`${day === value ? "is-edge" : ""} ${day.startsWith(month) ? "" : "is-other"} ${day === today ? "is-today" : ""}`}
                    aria-label={day.split("-").reverse().join("/")}
                    aria-pressed={day === value}
                    onClick={() => {
                      setValue(day);
                      close();
                    }}
                  >
                    {Number(day.slice(-2))}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
export function AgendaTimeField({
  name,
  label,
  initial,
  disabled = false,
}: {
  name: string;
  label: string;
  initial: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [hour, minute] = value.split(":");
  return (
    <div className="agenda-time-field">
      <span>{label}</span>
      <input type="hidden" name={name} value={value} />
      <div>
        <AdminSelect
          label={`${label}: hora`}
          value={hour}
          onValueChange={(h) => setValue(`${h}:${minute}`)}
          disabled={disabled}
          options={Array.from({ length: 24 }, (_, h) => ({
            value: String(h).padStart(2, "0"),
            label: String(h).padStart(2, "0"),
          }))}
        />
        <span>:</span>
        <AdminSelect
          label={`${label}: minutos`}
          value={minute}
          onValueChange={(m) => setValue(`${hour}:${m}`)}
          disabled={disabled}
          options={Array.from({ length: 60 }, (_, m) => ({
            value: String(m).padStart(2, "0"),
            label: String(m).padStart(2, "0"),
          }))}
        />
      </div>
    </div>
  );
}
