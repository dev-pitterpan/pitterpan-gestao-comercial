export const chartNumber = (value: unknown): number | null =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value))
    ? Number(value)
    : null;
export const chartDate = (value: unknown) => {
  const text = String(value ?? "");
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}` : text || "Sem data";
};
/** Shares are only valid for a complete nonnegative distribution and a positive base. */
export function distribution(values: (number | null)[], base?: number) {
  const sum = values.reduce<number>((total, value) => total + (value ?? 0), 0);
  const total = base ?? sum;
  const valid =
    values.every(
      (value) => value !== null && Number.isFinite(value) && value >= 0,
    ) &&
    Number.isFinite(total) &&
    total > 0 &&
    sum <= total + 1e-8;
  return {
    total,
    valid,
    shares: values.map((value) => (valid ? (value! / total) * 100 : null)),
  };
}
export function chartDomain(values: (number | null)[]) {
  const known = values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  const low = Math.min(0, ...known),
    high = Math.max(0, ...known);
  return {
    low,
    high: high === low ? low + 1 : high,
    hasData: known.length > 0,
  };
}
/** Bright derivatives of the brand palette keep data readable on graphite. */
export const infographicPalette = [
  "#6999bd",
  "#286da8",
  "#a1ceeb",
  "#c4473d",
  "#76828e",
  "#b7c0c8",
];
export function shareableMetric(metric: {
  key: string;
  format?: string;
  calculated?: boolean;
  ratio?: [string, string];
}) {
  return (
    !metric.ratio &&
    !metric.calculated &&
    !["percent", "hours"].includes(metric.format ?? "") &&
    !/average|avg|rate|per_|ticket/.test(metric.key)
  );
}
