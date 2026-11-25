/** Geometry uses real shares and signed values; no decorative quantity is invented. */
export function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}
export function annularSector(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
) {
  if (
    ![cx, cy, inner, outer, start, end].every(Number.isFinite) ||
    inner < 0 ||
    outer <= inner ||
    end <= start
  )
    return "";
  const span = Math.min(360, end - start),
    a = polar(cx, cy, outer, start),
    b = polar(cx, cy, outer, start + span),
    c = polar(cx, cy, inner, start + span),
    d = polar(cx, cy, inner, start);
  if (span >= 359.999) {
    const oppositeOuter = polar(cx, cy, outer, start + 180),
      oppositeInner = polar(cx, cy, inner, start + 180);
    return `M${a.x},${a.y} A${outer},${outer} 0 1 1 ${oppositeOuter.x},${oppositeOuter.y} A${outer},${outer} 0 1 1 ${a.x},${a.y} L${d.x},${d.y} A${inner},${inner} 0 1 0 ${oppositeInner.x},${oppositeInner.y} A${inner},${inner} 0 1 0 ${d.x},${d.y} Z`;
  }
  return `M${a.x},${a.y} A${outer},${outer} 0 ${span > 180 ? 1 : 0} 1 ${b.x},${b.y} L${c.x},${c.y} A${inner},${inner} 0 ${span > 180 ? 1 : 0} 0 ${d.x},${d.y} Z`;
}
/** Equal-angle fan petals encode value in annular area, not an exaggerated radius. */
export function fanRadius(value: number, max: number, inner = 48, outer = 123) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(max) ||
    value <= 0 ||
    max <= 0
  )
    return inner;
  return Math.sqrt(
    inner * inner + (outer * outer - inner * inner) * Math.min(1, value / max),
  );
}
/** Triangular columns keep a constant base, so height and area have the same scale. */
export function peakPolygon(
  x: number,
  base: number,
  tip: number,
  width: number,
) {
  if (
    ![x, base, tip, width].every(Number.isFinite) ||
    width <= 0 ||
    base === tip
  )
    return "";
  return `${x - width / 2},${base} ${x},${tip} ${x + width / 2},${base}`;
}
