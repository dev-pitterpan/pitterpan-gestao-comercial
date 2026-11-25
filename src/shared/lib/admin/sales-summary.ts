import { shiftDate, todayDate } from "./date-range.ts";

/** Missing days stay unknown outside the completed automatic import window. */
export function summaryDailyRows({
  daily,
  currency,
  start,
  end,
  completedAt,
  importing,
}: {
  daily: Record<string, string>[];
  currency: string;
  start: string;
  end: string;
  completedAt: string | null | undefined;
  importing: boolean;
}) {
  const completed =
    completedAt && !importing
      ? todayDate("America/Sao_Paulo", new Date(completedAt))
      : "";
  const automaticStart = completed ? shiftDate(completed, -59) : "";
  const existing = new Map(
    daily
      .filter((row) => row.currency === currency)
      .map((row) => [row.day, row]),
  );
  const rows: { day: string; received: string | null; net: string | null }[] =
    [];
  for (
    let day = start;
    day <= end && rows.length < 366;
    day = shiftDate(day, 1)
  ) {
    const row = existing.get(day);
    const empty =
      completed && day >= automaticStart && day < completed ? "0" : null;
    rows.push({
      day,
      received: row?.received ?? empty,
      net: row?.net ?? empty,
    });
  }
  return rows;
}
