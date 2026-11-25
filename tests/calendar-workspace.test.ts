import test from "node:test";
import assert from "node:assert/strict";
import {
  selectedCalendarDay,
  calendarKeyboardDay,
  appointmentsInMonth,
  calendarEventTime,
} from "../src/shared/lib/agenda/calendar.ts";
test("calendário mantém seleção válida ao navegar meses, anos e voltar ao dia atual", () => {
  assert.equal(
    selectedCalendarDay("2026-11", "2026-10-31", "2026-11-25"),
    "2026-11-25",
  );
  assert.equal(
    selectedCalendarDay("2026-12", "2026-11-25", "2026-11-25"),
    "2026-12-01",
  );
  assert.equal(
    selectedCalendarDay("2027-01", "2026-12-31", "2026-11-25"),
    "2027-01-01",
  );
  assert.equal(
    selectedCalendarDay("2026-12", "2026-12-31", "2026-11-25"),
    "2026-12-31",
  );
});
test("teclado atravessa semanas, meses e fevereiro bissexto", () => {
  assert.equal(calendarKeyboardDay("2026-11-30", "ArrowRight"), "2026-12-01");
  assert.equal(calendarKeyboardDay("2026-11-25", "Home"), "2026-11-22");
  assert.equal(calendarKeyboardDay("2026-11-25", "End"), "2026-11-28");
  assert.equal(calendarKeyboardDay("2026-11-25", "ArrowUp"), "2026-11-18");
  assert.equal(calendarKeyboardDay("2028-03-01", "ArrowLeft"), "2028-02-29");
  assert.equal(calendarKeyboardDay("2026-11-25", "Tab"), null);
  assert.equal(calendarKeyboardDay("2026-11-25", "constructor"), null);
});
test("resumo mensal conta compromissos que atravessam dias uma única vez e respeita limite exclusivo", () => {
  const rows = [
    {
      id: "old",
      starts_at: "2026-10-31T23:00:00-03:00",
      ends_at: "2026-11-01T00:00:00-03:00",
    },
    {
      id: "cross",
      starts_at: "2026-10-31T23:00:00-03:00",
      ends_at: "2026-11-02T01:00:00-03:00",
    },
    {
      id: "month",
      starts_at: "2026-11-01T00:00:00-03:00",
      ends_at: "2026-11-30T23:00:00-03:00",
    },
    {
      id: "after",
      starts_at: "2026-12-01T00:00:00-03:00",
      ends_at: "2026-12-01T01:00:00-03:00",
    },
    {
      id: "end",
      starts_at: "2026-11-30T23:30:00-03:00",
      ends_at: "2026-12-01T01:00:00-03:00",
    },
  ];
  assert.deepEqual(
    appointmentsInMonth("2026-11", rows).map((item) => item.id),
    ["cross", "month", "end"],
  );
  assert.equal(rows.length, 5);
});
test("compromisso noturno não aparenta iniciar novamente no segundo dia", () => {
  const start = "2026-11-24T23:30:00-03:00",
    end = "2026-11-25T01:00:00-03:00";
  assert.deepEqual(calendarEventTime(start, end, "2026-11-24"), {
    start: "23:30",
    end: "25/11/2026 às 01:00",
  });
  assert.deepEqual(calendarEventTime(start, end, "2026-11-25"), {
    start: "Continua",
    end: "01:00",
  });
  assert.deepEqual(
    calendarEventTime(
      "2026-11-25T01:00:00Z",
      "2026-11-25T02:00:00Z",
      "2026-11-24",
    ),
    { start: "22:00", end: "23:00" },
  );
});
