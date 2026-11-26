import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { readOrderPreviews } from "../src/shared/server/sales/order-previews.ts";
test("miniaturas dos pedidos limitam a página, preservam contagens e isolam fotos por loja e variante", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      await readFile(
        new URL("../src/shared/server/sales/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(`CREATE TABLE catalog_imports(id text,store_domain text);CREATE TABLE catalog_state(singleton boolean,active_import text);CREATE TABLE catalog_items(import_id text,product_id text,variant_id text,image_url text);
 INSERT INTO catalog_imports VALUES('active','a.myshopify.com');INSERT INTO catalog_state VALUES(true,'active');
 INSERT INTO catalog_items VALUES('active','gid://shopify/Product/1','1','https://cdn.shopify.com/s/files/active-one.png'),('active','gid://shopify/Product/1','2','https://cdn.shopify.com/s/files/active-two.png');`);
    const id = "gid://shopify/Order/1";
    for (const store of ["a.myshopify.com", "b.myshopify.com"]) {
      await db.query(
        `INSERT INTO pitterpan_sales_orders(store,id,name,processed_at,updated_at,financial_status,fulfillment_status,test,currency,total,received,refunded,net) VALUES($1,$2,'PP-1',now(),now(),'PAID','UNFULFILLED',false,'BRL',100,100,0,100)`,
        [store, id],
      );
      for (let i = 1; i <= 5; i++)
        await db.query(
          `INSERT INTO pitterpan_sales_items(store,order_id,id,variant_id,product_id,title,quantity,current_quantity,image_url) VALUES($1,$2,$3,$4,'gid://shopify/Product/1',$5,$6,0,$7)`,
          [
            store,
            id,
            `gid://shopify/LineItem/${i}`,
            `gid://shopify/ProductVariant/${i}`,
            `Produto ${i}`,
            i,
            i === 2 && store.startsWith("a.")
              ? "https://cdn.shopify.com/s/files/historical.png"
              : null,
          ],
        );
    }
    const result = await readOrderPreviews(db, "a.myshopify.com", [id]);
    const row = result.get(id)!;
    assert.equal(result.size, 1);
    assert.equal(row.products.length, 3);
    assert.equal(row.item_count, "5");
    assert.equal(row.units, "15");
    assert.match(
      row.products.find((product) => product.variant_id?.endsWith("/1"))!
        .image_url!,
      /active-one/,
    );
    const second = row.products.find((product) =>
      product.variant_id?.endsWith("/2"),
    )!;
    assert.match(second.image_url!, /active-two/);
    assert.match(second.fallback_image_url!, /historical/);
    const other = (await readOrderPreviews(db, "b.myshopify.com", [id])).get(
      id,
    )!;
    assert.ok(other.products.every((product) => product.image_url === null));
    assert.equal(
      (
        await readOrderPreviews(db, "a.myshopify.com", [
          "gid://shopify/Order/999",
        ])
      ).size,
      0,
    );
    assert.equal((await readOrderPreviews(db, "a.myshopify.com", [])).size, 0);
  } finally {
    await db.close();
  }
});
