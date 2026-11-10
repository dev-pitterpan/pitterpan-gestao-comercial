"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  calendarDate,
  dateRangeSchema,
  shiftDate,
  todayDate,
  type DateRange,
} from "../../lib/admin/date-range";
import useDatePopover from "./useDatePopover";

const display = (day: string) =>
  day ? day.split("-").reverse().join("/") : "";
function parseDate(text: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return "";
  const result = calendarDate.safeParse(text.split("/").reverse().join("-"));
  return result.success ? result.data : "";
}

function dateText(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter(Boolean)
    .join("/");
}

export default function DateRangePicker({
  value,
  onChange,
  resetLabel = "Usar período rápido",
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  resetLabel?: string;
}) {
  const id = useId(),
    root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    startInput = useRef<HTMLInputElement>(null),
    panelRef = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLDivElement>(null),
    today = todayDate();
  const [open, setOpen] = useState(false),
    [fields, setFields] = useState({
      start: display(value.start),
      end: display(value.end),
    }),
    [choosingEnd, setChoosingEnd] = useState(false),
    [month, setMonth] = useState(today.slice(0, 7) + "-01");
  useDatePopover(open, trigger, panelRef, 560);
  useEffect(() => {
    if (!open) return;
    function dismiss(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const initialFocus = window.matchMedia("(max-width: 600px)").matches
      ? heading
      : startInput;
    initialFocus.current?.focus({ preventScroll: true });
  }, [open]);
  const changeMonth = (amount: number) => {
    const d = new Date(`${month}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + amount);
    setMonth(d.toISOString().slice(0, 10));
  };
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const draft = { start: parseDate(fields.start), end: parseDate(fields.end) };
  function updateField(field: keyof DateRange, raw: string) {
    const text = dateText(raw);
    setFields((current) => ({ ...current, [field]: text }));
    const day = parseDate(text);
    if (day && day <= today) setMonth(day.slice(0, 7) + "-01");
  }
  const invalidField = (field: keyof DateRange) =>
    !!fields[field] && (!draft[field] || draft[field] > today);
  const valid =
    !!draft.start &&
    !!draft.end &&
    !invalidField("start") &&
    !invalidField("end") &&
    dateRangeSchema.safeParse(draft).success;
  return (
    <div
      className="admin-date-range"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        type="button"
        className={`admin-button admin-date-trigger ${value.start ? "is-active" : ""}`}
        ref={trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open) {
            setFields({ start: display(value.start), end: display(value.end) });
            setChoosingEnd(false);
            const start = value.start || shiftDate(today, -29);
            const d = new Date(`${start.slice(0, 7)}-01T12:00:00Z`);
            setMonth(d.toISOString().slice(0, 10));
          }
          setOpen(!open);
        }}
      >
        <CalendarDays size={16} />
        {value.start
          ? `${display(value.start)} — ${display(value.end)}`
          : "Escolher datas"}
      </button>
      {open && (
        <div
          className="admin-date-popover"
          ref={panelRef}
          popover="manual"
          id={id}
          role="dialog"
          aria-label="Selecionar intervalo de datas"
        >
          <div className="admin-date-heading" ref={heading} tabIndex={-1}>
            <strong>
              {choosingEnd
                ? "Selecione a data final"
                : "Selecione a data inicial"}
            </strong>
            <span>Até 366 dias por consulta</span>
          </div>
          <div className="admin-date-inputs">
            <label>
              Data inicial
              <span className="admin-date-field-control">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  ref={startInput}
                  value={fields.start}
                  aria-invalid={invalidField("start") || undefined}
                  onFocus={() => setChoosingEnd(false)}
                  onChange={(event) => updateField("start", event.target.value)}
                />
                <CalendarDays size={15} aria-hidden="true" />
              </span>
            </label>
            <span>até</span>
            <label>
              Data final
              <span className="admin-date-field-control">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={fields.end}
                  aria-invalid={invalidField("end") || undefined}
                  onFocus={() => setChoosingEnd(true)}
                  onChange={(event) => updateField("end", event.target.value)}
                />
                <CalendarDays size={15} aria-hidden="true" />
              </span>
            </label>
          </div>
          <div className="admin-date-months">
            <button
              className="admin-date-nav admin-date-nav--previous"
              type="button"
              aria-label="Mês anterior"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="admin-date-nav admin-date-nav--next"
              type="button"
              aria-label="Próximo mês"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={17} />
            </button>
            {[0, 1].map((offset) => {
              const date = new Date(`${month}T12:00:00Z`);
              date.setUTCMonth(date.getUTCMonth() + offset);
              const first = date.toISOString().slice(0, 10);
              const startDay = (date.getUTCDay() + 6) % 7;
              const count = new Date(
                Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
              ).getUTCDate();
              return (
                <section key={offset}>
                  <h3>
                    {new Intl.DateTimeFormat("pt-BR", {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(date)}
                  </h3>
                  <div className="admin-calendar-grid">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
                      (d) => (
                        <span key={d}>{d}</span>
                      ),
                    )}
                    {Array.from({ length: startDay }, (_, i) => (
                      <span key={`blank${i}`} />
                    ))}
                    {Array.from({ length: count }, (_, i) => {
                      const day = shiftDate(first, i),
                        edge = day === draft.start || day === draft.end,
                        inside =
                          draft.start &&
                          draft.end &&
                          day > draft.start &&
                          day < draft.end;
                      return (
                        <button
                          type="button"
                          key={day}
                          disabled={day > today}
                          className={`${edge ? "is-edge" : ""} ${inside ? "is-between" : ""} ${day === today ? "is-today" : ""}`}
                          aria-label={display(day)}
                          aria-pressed={edge || !!inside}
                          onClick={() => {
                            if (
                              !choosingEnd ||
                              !draft.start ||
                              day < draft.start
                            ) {
                              setFields({ start: display(day), end: "" });
                              setChoosingEnd(true);
                            } else {
                              setFields((d) => ({ ...d, end: display(day) }));
                              setChoosingEnd(false);
                            }
                          }}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          {((fields.start.length === 10 && invalidField("start")) ||
            (fields.end.length === 10 && invalidField("end")) ||
            (draft.start && draft.end && !valid)) && (
            <p className="admin-date-error" role="alert">
              Use datas válidas até hoje e um intervalo de até 366 dias.
            </p>
          )}
          <footer>
            <button
              className="admin-text-link"
              type="button"
              onClick={() => {
                onChange({ start: "", end: "" });
                close();
              }}
            >
              {resetLabel}
            </button>
            <div>
              <button className="admin-button" type="button" onClick={close}>
                Cancelar
              </button>
              <button
                className="admin-button admin-button-primary"
                type="button"
                disabled={!valid}
                onClick={() => {
                  if (valid) {
                    onChange(draft);
                    close();
                  }
                }}
              >
                <Check size={14} />
                Aplicar
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
