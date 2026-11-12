import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import sharp from "sharp";
import {
  listImages,
  processImages,
} from "../src/shared/server/catalog-images/repository.ts";

test("lista fotos antes da migração e converte a imagem em WebP de 1000 por 1000", async (t) => {
  const db = new PGlite();
  const source = "https://cdn.shopify.com/s/files/1/example.jpg";
  const version = "00000000-0000-4000-8000-000000000001";
  try {
    await db.exec(
      await readFile(
        new URL("../src/shared/server/database/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.query(
      "INSERT INTO catalog_imports (id,status,store_domain) VALUES ($1,'active','fixture.myshopify.com')",
      [version],
    );
    await db.query(
      "UPDATE catalog_state SET active_import=$1 WHERE singleton",
      [version],
    );
    await db.query(
      `INSERT INTO catalog_items (import_id,id,variant_id,product_id,name,sku,image_url,images,site_url,updated_at,search_text,price,currency)
       VALUES ($1,'1','1','1','Balão','ABC-1',$2,jsonb_build_array(jsonb_build_object('url',$2::text)),'','','balão',1,'BRL')`,
      [version, source],
    );
    const pending = await listImages("ABC-1", "pending", 1, 0, db);
    assert.equal(pending.images.length, 1);
    assert.equal(pending.images[0].source, source);
    assert.equal(pending.images[0].status, "pending");
    const original = await sharp({
      create: { width: 80, height: 40, channels: 3, background: "#c92830" },
    })
      .jpeg()
      .toBuffer();
    t.mock.method(globalThis, "fetch", async (url: string) => {
      assert.equal(url, source);
      return new Response(new Uint8Array(original));
    });
    assert.deepEqual(await processImages([source], 12, db), {
      processed: 1,
      converted: 1,
      failed: 0,
      more: false,
    });
    const completed = await listImages("balão", "completed", 1, 7, db);
    assert.equal(completed.images.length, 1);
    assert.equal(completed.images[0].original_format, "jpeg");
    const { rows } = await db.query<{ webp: Uint8Array }>(
      "SELECT webp FROM pitterpan_catalog_images WHERE source=$1",
      [source],
    );
    const metadata = await sharp(Buffer.from(rows[0].webp)).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 1000);
    assert.equal(metadata.height, 1000);
    assert.equal((await processImages([source], 12, db)).processed, 0);
  } finally {
    await db.close();
  }
});
