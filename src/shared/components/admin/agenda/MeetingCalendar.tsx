"use client";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List,
  Clock3,
  CalendarCheck2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  monthDays,
  monthShift,
  overlapsDay,
  selectedCalendarDay,
  appointmentsInMonth,
} from "../../../lib/agenda/calendar";
import { todayDate } from "../../../lib/admin/date-range";
import type { Appointment, Supplier } from "../../../lib/agenda/types";
import type { Occasion } from "../../../lib/agenda/occasions";
import type { Save } from "./shared";
import AppointmentEditor from "./AppointmentEditor";
import OccasionEditor from "./OccasionEditor";
import CalendarMonth from "./CalendarMonth";
import CalendarDayPanel from "./CalendarDayPanel";
import CalendarScheduleList from "./CalendarScheduleList";
import CalendarEditorDialog from "./CalendarEditorDialog";
import PitterSpinner from "../PitterSpinner";
export default function MeetingCalendar({
  month,
  onMonth,
  appointments,
  dates,
  suppliers,
  save,
  busy,
  loading = false,
  available = true,
}: {
  month: string;
  onMonth: (month: string) => void;
  appointments: Appointment[];
  dates: Occasion[];
  suppliers: Supplier[];
  save: Save;
  busy: boolean;
  loading?: boolean;
  available?: boolean;
}) {
  const today = todayDate();
  const [selection, setSelection] = useState(today);
  const day = selectedCalendarDay(month, selection, today);
  const [view, setView] = useState<"month" | "list">("month");
  const [editor, setEditor] = useState<Appointment | "new" | null>(null);
  const [dateEditor, setDateEditor] = useState<Occasion | "new" | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const disabled = busy || loading || !available;
  const days = monthDays(month);
  const visibleDates = dates.filter((item) => showHidden || !item.hidden);
  const events = appointments.filter((item) => item.status !== "cancelled");
  const monthly = appointmentsInMonth(month, events);
  const monthlyDates = visibleDates.filter((item) =>
    item.event_date.startsWith(month),
  );
  const dayDates = visibleDates.filter((item) => item.event_date === day);
  const dayEvents = appointments
    .filter((item) => overlapsDay(item.starts_at, item.ends_at, day))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const nextDates = monthlyDates
    .filter((item) => item.event_date > day)
    .sort(
      (a, b) =>
        a.event_date.localeCompare(b.event_date) ||
        a.title.localeCompare(b.title, "pt-BR"),
    )
    .slice(0, 3);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
  function closeEditors() {
    setEditor(null);
    setDateEditor(null);
  }
  function selectDay(value: string) {
    setSelection(value);
    closeEditors();
    if (!value.startsWith(month)) onMonth(value.slice(0, 7));
  }
  function navigate(next: string) {
    setSelection(selectedCalendarDay(next, "", today));
    closeEditors();
    onMonth(next);
  }
  function create(value: string) {
    selectDay(value);
    setEditor("new");
  }
  function editAppointment(item: Appointment, value: string) {
    selectDay(value);
    setEditor(item);
  }
  function editOccasion(item: Occasion) {
    selectDay(item.event_date);
    setDateEditor(item);
  }
  return (
    <section
      className="agenda-premium"
      aria-label="Agenda e datas importantes"
      aria-busy={loading}
    >
      <header className="agenda-premium-heading">
        <div>
          <span className="agenda-premium-overline">
            <span className="agenda-premium-heading-icon">
              <CalendarDays size={16} />
            </span>
            PLANEJAMENTO DA EQUIPE
          </span>
          <h2>Seu tempo, bem organizado.</h2>
          <p>Compromissos, fornecedores e datas importantes em um só lugar.</p>
        </div>
        <div className="agenda-premium-summary" aria-label="Resumo do mês">
          <div>
            <Clock3 size={16} />
            <strong>
              {loading || !available
                ? "—"
                : monthly.filter((item) => item.status === "scheduled").length}
            </strong>
            <span>agendados</span>
          </div>
          <div>
            <CalendarCheck2 size={16} />
            <strong>
              {loading || !available
                ? "—"
                : monthly.filter((item) => item.status === "completed").length}
            </strong>
            <span>concluídos</span>
          </div>
          <div>
            <CalendarDays size={16} />
            <strong>{loading || !available ? "—" : monthlyDates.length}</strong>
            <span>datas importantes</span>
          </div>
        </div>
      </header>
      <div className="agenda-premium-layout">
        <section
          className="agenda-premium-canvas"
          aria-label="Calendário da equipe"
        >
          <div className="agenda-premium-toolbar">
            <div className="agenda-premium-month-nav">
              <h3 aria-live="polite">{monthLabel}</h3>
              <div>
                <button
                  type="button"
                  aria-label="Mês anterior"
                  className="agenda-icon-button"
                  disabled={busy}
                  onClick={() => navigate(monthShift(month, -1))}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Próximo mês"
                  className="agenda-icon-button"
                  disabled={busy}
                  onClick={() => navigate(monthShift(month, 1))}
                >
                  <ChevronRight size={17} />
                </button>
                <button
                  type="button"
                  className="agenda-premium-today"
                  disabled={busy}
                  onClick={() => {
                    selectDay(today);
                    onMonth(today.slice(0, 7));
                  }}
                >
                  Hoje
                </button>
              </div>
            </div>
            <div className="agenda-premium-toolbar-actions">
              <div
                className="agenda-premium-view"
                role="group"
                aria-label="Visualização do calendário"
              >
                <button
                  type="button"
                  aria-pressed={view === "month"}
                  onClick={() => setView("month")}
                >
                  <CalendarDays size={15} />
                  Mês
                </button>
                <button
                  type="button"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={16} />
                  Lista
                </button>
              </div>
              <button
                type="button"
                className="agenda-premium-primary"
                disabled={disabled}
                onClick={() => create(day)}
              >
                <Plus size={17} />
                Novo compromisso
              </button>
            </div>
          </div>
          <div className="agenda-premium-filterline">
            <div
              className="agenda-premium-legend"
              aria-label="Tipos de eventos"
            >
              <span>
                <i className="meeting" />
                Compromissos
              </span>
              <span>
                <i className="holiday" />
                Feriados
              </span>
              <span>
                <i className="commercial" />
                Comerciais
              </span>
              <span>
                <i className="observance" />
                Outras datas
              </span>
            </div>
            <div className="agenda-premium-options">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  closeEditors();
                  setDateEditor("new");
                }}
              >
                <Plus size={14} />
                Nova data
              </button>
              <button
                type="button"
                aria-pressed={showHidden}
                disabled={disabled}
                onClick={() => setShowHidden(!showHidden)}
                title={
                  showHidden
                    ? "Ocultar datas marcadas como ocultas"
                    : "Mostrar datas marcadas como ocultas"
                }
              >
                {showHidden ? <Eye size={14} /> : <EyeOff size={14} />}Ocultas
              </button>
            </div>
          </div>
          <div className="agenda-premium-content">
            {available &&
              (view === "month" ? (
                <CalendarMonth
                  days={days}
                  month={month}
                  day={day}
                  today={today}
                  events={events}
                  dates={visibleDates}
                  disabled={disabled}
                  onSelect={selectDay}
                  onCreate={create}
                  onAppointment={editAppointment}
                  onOccasion={editOccasion}
                />
              ) : (
                <CalendarScheduleList
                  days={days}
                  month={month}
                  events={events}
                  dates={visibleDates}
                  busy={disabled}
                  onAppointment={editAppointment}
                  onOccasion={editOccasion}
                  onCreate={create}
                />
              ))}
            {(loading || !available) && (
              <div className="agenda-premium-loading" role="status">
                {loading ? (
                  <PitterSpinner label="Atualizando seu calendário…" />
                ) : (
                  <p>
                    Este mês está indisponível. Use Atualizar para tentar
                    novamente.
                  </p>
                )}
              </div>
            )}
          </div>
          <footer className="agenda-premium-footer">
            <span>
              <Clock3 size={13} />
              Horário de Brasília
            </span>
            <span>Selecione um dia para ver a programação.</span>
          </footer>
        </section>
        {!loading && available ? (
          <CalendarDayPanel
            day={day}
            today={today}
            appointments={dayEvents}
            dates={dayDates}
            suppliers={suppliers}
            busy={busy}
            onCreate={() => create(day)}
            onAppointment={(item) => editAppointment(item, day)}
            onOccasion={editOccasion}
            onSelect={selectDay}
            nextDates={nextDates}
          />
        ) : (
          <div className="agenda-premium-rail-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      {(editor || dateEditor) && (
        <CalendarEditorDialog
          label={
            dateEditor
              ? "Planejamento da data"
              : editor === "new"
                ? "Novo compromisso"
                : "Editar compromisso"
          }
          busy={busy}
          onClose={() => {
            if (!busy) closeEditors();
          }}
        >
          {dateEditor ? (
            <OccasionEditor
              key={
                dateEditor === "new"
                  ? `date-${day}`
                  : `${dateEditor.id}-${dateEditor.revision}`
              }
              occasion={dateEditor === "new" ? undefined : dateEditor}
              day={day}
              save={save}
              busy={busy}
              onClose={() => {
                if (!busy) closeEditors();
              }}
            />
          ) : (
            <AppointmentEditor
              key={
                editor === "new"
                  ? `new-${day}`
                  : editor
                    ? `${editor.id}-${editor.revision}`
                    : ""
              }
              appointment={editor === "new" || !editor ? undefined : editor}
              day={day}
              suppliers={suppliers}
              save={save}
              busy={busy}
              onClose={() => {
                if (!busy) closeEditors();
              }}
            />
          )}
        </CalendarEditorDialog>
      )}
    </section>
  );
}
