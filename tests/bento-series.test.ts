import test from "node:test";
import assert from "node:assert/strict";
import {
  bentoSeries,
  bentoCalendar,
} from "../src/shared/lib/admin/bento-series.ts";
import { shiftDate } from "../src/shared/lib/admin/date-range.ts";
test("bento semanal agrupa por segunda-feira sem transformar ausência em zero", () => {
  const rows = [
    { day: "2026-12-27", received: "10.50", net: "-2" },
    { day: "2026-12-28", received: "20", net: "18" },
    { day: "2026-12-29", received: null, net: null },
    { day: "2027-01-01", received: "4", net: "3" },
  ];
  assert.deepEqual(
    bentoSeries(rows, "received", "day").map((row) => row.value),
    [10.5, 20, null, 4],
  );
  assert.deepEqual(bentoSeries(rows, "received", "week"), [
    { start: "2026-12-27", end: "2026-12-27", value: 10.5 },
    { start: "2026-12-28", end: "2027-01-01", value: null },
  ]);
  assert.equal(bentoSeries(rows, "net", "week")[0].value, -2);
  assert.equal(
    bentoSeries(
      [
        { day: "2026-12-28", received: "0", net: "0" },
        { day: "2026-12-29", received: "4.5", net: "-2" },
      ],
      "received",
      "week",
    )[0].value,
    4.5,
  );
});
test("bento calendário delimita janela, alinha semana e distingue zero/desconhecido", () => {
  const rows = Array.from({ length: 40 }, (_, index) => ({
    day: shiftDate("2026-11-01", index),
    received: index === 39 ? null : index === 38 ? "0" : String(index),
    net: String(index),
  }));
  const calendar = bentoCalendar(rows);
  assert.equal(calendar.truncated, true);
  assert.equal(calendar.days.length, 35);
  assert.equal(calendar.days[0].day, "2026-11-06");
  assert.equal(calendar.offset, 4);
  assert.equal(calendar.days.at(-1)?.level, -1);
  assert.equal(calendar.days.at(-2)?.level, 0);
  assert.ok(calendar.days.every((day) => day.level >= -1 && day.level <= 4));
  assert.deepEqual(bentoCalendar([]), {
    offset: 0,
    truncated: false,
    days: [],
  });
});
