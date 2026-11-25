import { shiftDate } from "../admin/date-range.ts";
export function monthDays(month: string) {
  const first = `${month}-01`;
  const start = shiftDate(first, -new Date(`${first}T12:00:00Z`).getUTCDay());
  return Array.from({ length: 42 }, (_, i) => shiftDate(start, i));
}
export function monthShift(month: string, step: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + step);
  return date.toISOString().slice(0, 7);
}
export function localDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
export function localTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function overlapsDay(start: string, end: string, day: string) {
  return (
    Date.parse(start) < Date.parse(`${shiftDate(day, 1)}T00:00:00-03:00`) &&
    Date.parse(end) > Date.parse(`${day}T00:00:00-03:00`)
  );
}

/** Keep selection in the displayed month, including programmatic month changes. */
export function selectedCalendarDay(
  month: string,
  selected: string,
  today: string,
) {
  return selected.startsWith(`${month}-`)
    ? selected
    : today.startsWith(`${month}-`)
      ? today
      : `${month}-01`;
}
export function calendarKeyboardDay(day: string, key: string) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  const steps: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
    Home: -weekday,
    End: 6 - weekday,
  };
  return Object.hasOwn(steps, key) ? shiftDate(day, steps[key]) : null;
}

/** Count overlapping commitments once, even when they cross several days/months. */
export function appointmentsInMonth<
  T extends { starts_at: string; ends_at: string },
>(month: string, items: T[]): T[] {
  const start = Date.parse(`${month}-01T00:00:00-03:00`);
  const end = Date.parse(`${monthShift(month, 1)}-01T00:00:00-03:00`);
  return items.filter(
    (item) =>
      Date.parse(item.starts_at) < end && Date.parse(item.ends_at) > start,
  );
}

/** An overnight meeting continues on the next day instead of appearing to start again. */
export function calendarEventTime(start: string, end: string, day: string) {
  const endDay = localDay(end);
  return {
    start: localDay(start) < day ? "Continua" : localTime(start),
    end:
      endDay === day
        ? localTime(end)
        : `${endDay.split("-").reverse().join("/")} às ${localTime(end)}`,
  };
}
