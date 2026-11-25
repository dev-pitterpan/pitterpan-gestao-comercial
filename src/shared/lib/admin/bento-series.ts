import { shiftDate } from "./date-range.ts";
export type BentoDay = {
  day: string;
  received: string | null;
  net: string | null;
};
export type BentoBucket = { start: string; end: string; value: number | null };
export function bentoSeries(
  rows: BentoDay[],
  metric: "received" | "net",
  period: "day" | "week",
): BentoBucket[] {
  if (period === "day")
    return rows.map((row) => ({
      start: row.day,
      end: row.day,
      value: row[metric] === null ? null : Number(row[metric]),
    }));
  const groups = new Map<string, BentoBucket>();
  for (const row of rows) {
    const weekday = new Date(`${row.day}T12:00:00Z`).getUTCDay();
    const key = shiftDate(row.day, -((weekday + 6) % 7));
    const current = groups.get(key);
    const value = row[metric] === null ? null : Number(row[metric]);
    if (!current) groups.set(key, { start: row.day, end: row.day, value });
    else {
      current.end = row.day;
      current.value =
        current.value === null || value === null ? null : current.value + value;
    }
  }
  return [...groups.values()];
}
/** A bounded calendar view is explicitly labeled; it never changes the reporting totals. */
export function bentoCalendar(rows: BentoDay[], limit = 35) {
  const visible = rows.slice(-limit);
  const max = Math.max(
    0,
    ...visible.flatMap((row) =>
      row.received === null ? [] : [Number(row.received)],
    ),
  );
  const offset = visible.length
    ? (new Date(`${visible[0].day}T12:00:00Z`).getUTCDay() + 6) % 7
    : 0;
  return {
    offset,
    truncated: rows.length > visible.length,
    days: visible.map((row) => ({
      day: row.day,
      value: row.received === null ? null : Number(row.received),
      level:
        row.received === null
          ? -1
          : Number(row.received) === 0
            ? 0
            : Math.max(1, Math.ceil((Number(row.received) / max) * 4)),
    })),
  };
}
