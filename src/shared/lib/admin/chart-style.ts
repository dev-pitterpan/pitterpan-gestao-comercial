import { brandColors } from "./brand-colors.ts";
/** Series use the management identity; labels preserve their business meaning. */
export const chartColors = {
  blue: brandColors.navy,
  teal: brandColors.blue,
  green: brandColors.steel,
  amber: brandColors.warning,
  coral: brandColors.coral,
  slate: brandColors.slate,
};
export const chartPalette = [
  chartColors.blue,
  chartColors.teal,
  chartColors.green,
  chartColors.amber,
  chartColors.coral,
  chartColors.slate,
];

type Point = { x: number; y: number };
/** Monotone cubic interpolation: passes through real points without inventing peaks. */
export function monotonePath(points: Point[]) {
  if (!points.length) return "";
  const first = points[0];
  if (points.length === 1) return `M${first.x},${first.y}`;
  const slopes = points
    .slice(1)
    .map((point, i) => (point.y - points[i].y) / (point.x - points[i].x));
  const tangents = points.map((_, i) =>
    i === 0
      ? slopes[0]
      : i === points.length - 1
        ? slopes.at(-1)!
        : slopes[i - 1] * slopes[i] <= 0
          ? 0
          : (slopes[i - 1] + slopes[i]) / 2,
  );
  slopes.forEach((slope, i) => {
    if (!slope) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      return;
    }
    const a = tangents[i] / slope,
      b = tangents[i + 1] / slope;
    const length = Math.hypot(a, b);
    if (length > 3) {
      tangents[i] = (3 * a * slope) / length;
      tangents[i + 1] = (3 * b * slope) / length;
    }
  });
  return points.slice(1).reduce((path, point, i) => {
    const previous = points[i],
      third = (point.x - previous.x) / 3;
    return `${path} C${previous.x + third},${previous.y + third * tangents[i]} ${point.x - third},${point.y - third * tangents[i + 1]} ${point.x},${point.y}`;
  }, `M${first.x},${first.y}`);
}
