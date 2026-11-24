import test from "node:test";
import assert from "node:assert/strict";
import { monotonePath } from "../src/shared/lib/admin/chart-style.ts";

test("curvas preservam os pontos reais e não inventam extremos entre dias", () => {
  assert.equal(monotonePath([]), "");
  assert.equal(monotonePath([{ x: 10, y: 20 }]), "M10,20");
  for (const values of [
    [0, 100, 10, 80, 0],
    [20, 20, 20, 20],
    [-40, -5, 0, 100],
    [0, 1, 1000, 999, 0],
  ]) {
    const points = values.map((y, x) => ({ x: x * 15, y }));
    const path = monotonePath(points);
    const curves = path.split(" C").slice(1);
    assert.equal(curves.length, points.length - 1);
    curves.forEach((curve, i) => {
      const [x1, y1, x2, y2, x3, y3] = curve.split(/[ ,]/).map(Number);
      assert.equal(x3, points[i + 1].x);
      assert.equal(y3, points[i + 1].y);
      const low = Math.min(points[i].y, y3),
        high = Math.max(points[i].y, y3);
      assert.ok(x1 >= points[i].x && x2 <= x3);
      for (let sample = 0; sample <= 100; sample++) {
        const t = sample / 100,
          inverse = 1 - t;
        const y =
          inverse ** 3 * points[i].y +
          3 * inverse ** 2 * t * y1 +
          3 * inverse * t ** 2 * y2 +
          t ** 3 * y3;
        assert.ok(
          y >= low - 1e-8 && y <= high + 1e-8,
          `Curva fora do intervalo real ${low}–${high}: ${y}`,
        );
      }
    });
  }
});
