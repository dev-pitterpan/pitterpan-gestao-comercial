import test from "node:test";
import assert from "node:assert/strict";
import { summaryDailyRows } from "../src/shared/lib/admin/sales-summary.ts";
test("gráfico do resumo respeita moeda, valores negativos e dias sem cobertura", () => {
  const args = {
    start: "2026-09-25",
    end: "2026-11-25",
    currency: "BRL",
    completedAt: "2026-11-25T02:00:00Z",
    importing: false,
    daily: [
      { day: "2026-11-23", currency: "BRL", received: "10", net: "-20" },
      { day: "2026-11-23", currency: "USD", received: "900", net: "900" },
    ],
  };
  const rows = summaryDailyRows(args);
  assert.equal(rows[0].received, null);
  assert.equal(rows.find((row) => row.day === "2026-11-23")?.net, "-20");
  // The completed timestamp is still November 24 in Brasília.
  assert.equal(rows.find((row) => row.day === "2026-11-24")?.received, null);
  assert.equal(rows.find((row) => row.day === "2026-11-22")?.received, "0");
  assert.equal(rows.at(-1)?.received, null);
  const importing = summaryDailyRows({ ...args, importing: true });
  assert.equal(
    importing.find((row) => row.day === "2026-11-22")?.received,
    null,
  );
  assert.equal(
    importing.find((row) => row.day === "2026-11-23")?.received,
    "10",
  );
  assert.ok(
    summaryDailyRows({ ...args, completedAt: null }).filter(
      (row) => row.received !== null,
    ).length === 1,
  );
});
