import test from "node:test";
import assert from "node:assert/strict";
import { drainSales } from "../src/shared/server/sales/drain.ts";

test("agendamento continua todos os lotes, espera pela exclusividade e preserva falhas", async () => {
  const pages = [
    { more: true, busy: true, processed: 0 },
    { more: true, busy: false, processed: 5 },
    { more: true, busy: false, processed: 5 },
    { more: false, busy: false, processed: 2 },
  ];
  const waits: boolean[] = [];
  let calls = 0;
  assert.deepEqual(
    await drainSales(
      async () => pages[calls++],
      async (busy) => {
        waits.push(busy);
      },
    ),
    { processed: 12 },
  );
  assert.equal(calls, 4);
  assert.deepEqual(waits, [true, false, false]);
  await assert.rejects(
    () =>
      drainSales(
        async () => {
          throw new Error("Shopify indisponível");
        },
        async () => {},
      ),
    /Shopify indisponível/,
  );
  await assert.rejects(
    () =>
      drainSales(
        async () => ({ more: true, busy: false, processed: 5 }),
        async () => {},
        2,
      ),
    /limite de lotes/,
  );
});
