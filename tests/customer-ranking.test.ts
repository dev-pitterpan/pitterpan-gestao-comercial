import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { readCustomerRanking } from "../src/shared/server/sales/customer-ranking.ts";

test("ranking identifica clientes por ID, desconta reembolsos e lista os produtos do pedido selecionado", async () => {
  const db = new PGlite();
  const store = "fixture.myshopify.com";
  const id = (number: number) => `gid://shopify/Customer/${number}`;
  try {
    await db.exec(
      await readFile(
        new URL("../src/shared/server/sales/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.query(
      `INSERT INTO pitterpan_sales_orders
      (store,id,name,processed_at,updated_at,financial_status,fulfillment_status,cancelled_at,test,currency,total,received,refunded,net,customer)
      SELECT $1, 'gid://shopify/Order/'||n, '#'||n, '2026-10-20T14:30:00Z', now(),
        CASE WHEN n=3 THEN 'PARTIALLY_REFUNDED' WHEN n=5 THEN 'REFUNDED' ELSE 'PAID' END,
        'UNFULFILLED', CASE WHEN n=4 THEN now() END, n=6, 'BRL',
        amount, amount, refunded, amount-refunded,
        CASE WHEN customer_id IS NOT NULL THEN jsonb_build_object('id','gid://shopify/Customer/'||customer_id,'name','Nome igual') END
      FROM (VALUES (1,1,9,0),(2,1,7,0),(3,2,100,35),(4,1,1000,0),(5,2,90,90),(6,2,1000,0),(7,NULL,500,0))
        AS v(n,customer_id,amount,refunded)`,
      [store],
    );
    await db.query(
      `INSERT INTO pitterpan_sales_items (store,order_id,id,title,quantity,current_quantity,image_url)
      VALUES ($1,'gid://shopify/Order/3','item-3','Balão',3,2,'https://example.test/balao.png')`,
      [store],
    );
    const range = { start: "2026-10-01", end: "2026-10-31" };
    const value = await readCustomerRanking(
      db,
      store,
      range,
      "value",
      99,
      id(2),
      99,
    );
    assert.equal(value.total, 2);
    assert.equal(value.page, 1);
    assert.deepEqual(
      value.customers.map(({ id, purchases, net }) => [id, purchases, net]),
      [
        [id(2), "1", "65.00"],
        [id(1), "2", "16.00"],
      ],
    );
    assert.equal(value.orderPage, 1);
    assert.equal(value.orders[0].refunded, "35.00");
    assert.deepEqual(value.orders[0].items, [
      {
        id: "item-3",
        title: "Balão",
        quantity: 3,
        image: "https://example.test/balao.png",
      },
    ]);
    const count = await readCustomerRanking(
      db,
      store,
      range,
      "orders",
      1,
      id(99),
      1,
    );
    assert.equal(count.selected?.id, id(1));
    assert.equal(count.orders.length, 2);
  } finally {
    await db.close();
  }
});
