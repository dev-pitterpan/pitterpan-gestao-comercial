import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { readPriorityQueue } from "../src/shared/server/sales/priority-queue.ts";
import {
  prioritySelection,
  priorityHref,
  orderAgeDays,
  orderAgeLabel,
} from "../src/shared/lib/admin/priorities.ts";

test("prioridades: seleção valida categorias, ordenação e links sem aplicar período à fila", () => {
  assert.deepEqual(
    prioritySelection({ fila: "ready", ordem: "newest", pendencias: "2" }),
    { stage: "ready", sort: "newest", page: 2 },
  );
  assert.deepEqual(
    prioritySelection({ fila: "unknown", ordem: "sql", pendencias: "-5" }),
    { stage: "all", sort: "oldest", page: 1 },
  );
  assert.equal(prioritySelection({ pendencias: ["2"] }).page, 1);
  const url = new URL(
    priorityHref(
      { stage: "preparing", sort: "newest", page: 3 },
      new URLSearchParams({
        start: "2026-11-01",
        end: "2026-11-24",
        status: "CANCELLED",
        cursor: "invalid",
      }),
    ),
    "https://example.test",
  );
  assert.equal(url.searchParams.get("secao"), "prioridades");
  assert.equal(url.searchParams.get("fila"), "preparing");
  assert.equal(url.searchParams.get("pendencias"), "3");
  assert.equal(url.searchParams.get("start"), "2026-11-01");
  assert.equal(url.searchParams.has("status"), false);
  assert.equal(url.searchParams.has("cursor"), false);
});
test("tempo desde o pedido usa dias de calendário em Brasília e não gera prazo de entrega", () => {
  const now = new Date("2026-11-24T03:01:00Z");
  assert.equal(orderAgeDays("2026-11-24T02:59:00Z", now), 1);
  assert.equal(orderAgeDays("2026-11-24T03:00:00Z", now), 0);
  assert.equal(orderAgeDays("invalid", now), null);
  assert.equal(orderAgeDays(null, now), null);
  assert.equal(orderAgeLabel(null), "Data indisponível");
  assert.equal(orderAgeLabel(0), "Hoje");
  assert.equal(orderAgeLabel(1), "Há 1 dia");
  assert.equal(orderAgeLabel(9), "Há 9 dias");
});
test("fila completa pagina sem perder pedidos, isola loja e usa a mesma regra de atendimento dos indicadores", async () => {
  const db = new PGlite();
  const store = "queue.myshopify.com";
  try {
    await db.exec(
      await readFile(
        new URL("../src/shared/server/sales/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    async function insert(
      id: number,
      fulfillment = "UNFULFILLED",
      financial = "PAID",
      options: {
        cancelled?: boolean;
        test?: boolean;
        otherStore?: boolean;
        refunded?: number;
      } = {},
    ) {
      const refunded = options.refunded || 0;
      await db.query(
        `INSERT INTO pitterpan_sales_orders(store,id,name,processed_at,updated_at,financial_status,fulfillment_status,cancelled_at,test,currency,total,received,refunded,net,customer) VALUES($1,$2,$3,$4,$4,$5,$6,$7,$8,'BRL',100,100,$9,$10,$11::jsonb)`,
        [
          options.otherStore ? "other.myshopify.com" : store,
          `gid://shopify/Order/${id}`,
          `PP-${id}`,
          `2026-09-${String(id).padStart(2, "0")}T15:00:00Z`,
          financial,
          fulfillment,
          options.cancelled ? "2026-10-01T15:00:00Z" : null,
          options.test || false,
          refunded,
          100 - refunded,
          JSON.stringify({ name: `Cliente ${id}` }),
        ],
      );
    }
    for (let id = 1; id <= 10; id++)
      await insert(id, id > 8 ? "READY_FOR_PICKUP" : "UNFULFILLED");
    await insert(11, "FULFILLED");
    await insert(12, "UNFULFILLED", "PENDING");
    await insert(13, "UNFULFILLED", "PAID", { cancelled: true });
    await insert(14, "UNFULFILLED", "PAID", { test: true });
    await insert(15, "UNFULFILLED", "REFUNDED", { refunded: 100 });
    await insert(16, "UNFULFILLED", "PAID", { otherStore: true });
    await insert(17, "PARTIALLY_FULFILLED", "PARTIALLY_REFUNDED", {
      refunded: 40,
    });
    await db.query(
      `INSERT INTO pitterpan_sales_items(store,order_id,id,title,quantity,current_quantity,image_url) VALUES ($1,'gid://shopify/Order/1','1','Item sem imagem',2,2,NULL),($1,'gid://shopify/Order/1','2','Foto do produto',3,3,'https://cdn.shopify.com/test.webp'),($1,'gid://shopify/Order/1','3','Item removido',1,0,'https://cdn.shopify.com/removed.webp')`,
      [store],
    );
    const first = await readPriorityQueue(db, store, {
      stage: "all",
      sort: "oldest",
      page: 1,
    });
    assert.equal(first.counts.preparing, "9");
    assert.equal(first.counts.ready, "2");
    assert.equal(first.total, 11);
    assert.equal(first.pages, 2);
    assert.equal(first.orders.length, 8);
    assert.equal(first.orders[0].name, "PP-1");
    assert.equal(
      first.orders[0].image_url,
      "https://cdn.shopify.com/test.webp",
    );
    assert.equal(first.orders[0].item_title, "Foto do produto");
    assert.equal(first.orders[0].item_count, "2");
    assert.equal(first.orders[0].units, "5");
    assert.equal(first.sync, null);
    const second = await readPriorityQueue(db, store, {
      stage: "all",
      sort: "oldest",
      page: 2,
    });
    assert.equal(second.orders.length, 3);
    assert.equal(
      new Set([...first.orders, ...second.orders].map((order) => order.id))
        .size,
      11,
    );
    const preparing = await readPriorityQueue(db, store, {
      stage: "preparing",
      sort: "oldest",
      page: 2,
    });
    assert.equal(preparing.total, 9);
    assert.equal(preparing.orders.length, 1);
    assert.equal(preparing.orders[0].name, "PP-17");
    const ready = await readPriorityQueue(db, store, {
      stage: "ready",
      sort: "newest",
      page: 999,
    });
    assert.equal(ready.page, 1);
    assert.equal(ready.total, 2);
    assert.deepEqual(
      ready.orders.map((order) => order.name),
      ["PP-10", "PP-9"],
    );
    const empty = await readPriorityQueue(db, "empty.myshopify.com", {
      stage: "all",
      sort: "oldest",
      page: 999,
    });
    assert.equal(empty.total, 0);
    assert.equal(empty.page, 1);
    assert.equal(empty.pages, 1);
    assert.equal(empty.orders.length, 0);
  } finally {
    await db.close();
  }
});
