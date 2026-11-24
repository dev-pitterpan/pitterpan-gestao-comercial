/** Shared Web Mercator coordinates keep country contours and city markers aligned. */
export function mercatorPoint(
  longitude: number,
  latitude: number,
): [number, number] {
  const phi =
    (Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI) / 180;
  return [
    ((longitude + 180) / 360) * 1024,
    ((1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2) * 1024,
  ];
}
export function countryGeometry(source: string) {
  const tokens = source.match(/[MLZ]|-?\d+(?:\.\d+)?/g) || [];
  const rings: [number, number][][] = [];
  let ring: [number, number][] = [];
  for (let index = 0; index < tokens.length;) {
    const token = tokens[index++];
    if (token === "M") {
      ring = [];
      rings.push(ring);
    }
    if (token === "Z") continue;
    if (token === "M" || token === "L") {
      const longitude = Number(tokens[index++]) / 2.4 - 180;
      const latitude = 84 - Number(tokens[index++]) / 2.4;
      ring.push([longitude, latitude]);
    }
  }
  const points = rings.flat();
  return {
    rings,
    path: rings
      .map(
        (ring) =>
          ring
            .map(
              ([lng, lat], i) =>
                `${i ? "L" : "M"}${mercatorPoint(lng, lat).join(",")}`,
            )
            .join("") + "Z",
      )
      .join(""),
    bounds: [
      [
        Math.min(...points.map((p) => p[1])),
        Math.min(...points.map((p) => p[0])),
      ],
      [
        Math.max(...points.map((p) => p[1])),
        Math.max(...points.map((p) => p[0])),
      ],
    ] as [[number, number], [number, number]],
  };
}
/** Even/odd containment supports islands and interior holes without rectangular country hit areas. */
export function containsLocation(
  rings: [number, number][][],
  longitude: number,
  latitude: number,
) {
  let inside = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x, y] = ring[i],
        [previousX, previousY] = ring[j];
      if (
        y > latitude !== previousY > latitude &&
        longitude < ((previousX - x) * (latitude - y)) / (previousY - y) + x
      )
        inside = !inside;
    }
  return inside;
}
