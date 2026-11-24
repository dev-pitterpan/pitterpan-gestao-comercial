import { todayDate } from "./date-range.ts";
export const priorityStages = ["all", "preparing", "ready"] as const;
export type PriorityStage = (typeof priorityStages)[number];
export type PrioritySelection = {
  stage: PriorityStage;
  sort: "oldest" | "newest";
  page: number;
};
export function prioritySelection(
  params: Record<string, string | string[] | undefined>,
): PrioritySelection {
  return {
    stage:
      params.fila === "preparing" || params.fila === "ready"
        ? params.fila
        : "all",
    sort: params.ordem === "newest" ? "newest" : "oldest",
    page:
      typeof params.pendencias === "string" &&
      /^[1-9]\d{0,5}$/.test(params.pendencias)
        ? Number(params.pendencias)
        : 1,
  };
}
export function priorityHref(
  selection: PrioritySelection,
  source = new URLSearchParams(),
) {
  const params = new URLSearchParams({ secao: "prioridades" });
  for (const key of ["start", "end", "periodo"]) {
    const value = source.get(key);
    if (value) params.set(key, value);
  }
  if (selection.stage !== "all") params.set("fila", selection.stage);
  if (selection.sort !== "oldest") params.set("ordem", selection.sort);
  if (selection.page > 1) params.set("pendencias", String(selection.page));
  return `/gestor/?${params}`;
}
/** Calendar age in Brasília, not an SLA or a delivery deadline. */
export function orderAgeDays(
  date: string | null,
  now = new Date(),
): number | null {
  if (!date || !Number.isFinite(Date.parse(date))) return null;
  const created = todayDate("America/Sao_Paulo", new Date(date));
  return Math.max(
    0,
    Math.round(
      (Date.parse(todayDate("America/Sao_Paulo", now)) - Date.parse(created)) /
        86400000,
    ),
  );
}
export function orderAgeLabel(days: number | null) {
  return days === null
    ? "Data indisponível"
    : days === 0
      ? "Hoje"
      : days === 1
        ? "Há 1 dia"
        : `Há ${days.toLocaleString("pt-BR")} dias`;
}
