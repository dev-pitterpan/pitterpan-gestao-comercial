import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  fillQueueCatalogPhotos,
  fillQueueLivePhotos,
  type QueuePhoto,
} from "../src/shared/server/sales/product-photos.ts";
const photo = (
  id: string,
  variant: string | null = "1",
  product: string | null = "1",
  image_url: string | null = null,
): QueuePhoto => ({
  id,
  variant_id: variant ? `gid://shopify/ProductVariant/${variant}` : null,
  product_id: product ? `gid://shopify/Product/${product}` : null,
  image_url,
});
const url = (name: string) => `https://cdn.shopify.com/${name}.webp`;

test("fila recupera fotos apenas da importação ativa e da mesma loja, respeitando a variante", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      await readFile(
        new URL("../src/shared/server/database/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    const active = "11111111-1111-1111-1111-111111111111",
      old = "22222222-2222-2222-2222-222222222222";
    await db.query(
      "INSERT INTO catalog_imports(id,status,store_domain) VALUES($1,'active','shop.myshopify.com'),($2,'retired','shop.myshopify.com')",
      [active, old],
    );
    await db.query("UPDATE catalog_state SET active_import=$1", [active]);
    for (const [batch, variant, product, image] of [
      [active, "1", "1", url("exact")],
      [active, "2", "1", url("other-color")],
      [active, "3", "3", "https://evil.test/photo.png"],
      [old, "9", "9", url("retired")],
    ]) {
      await db.query(
        "INSERT INTO catalog_items(import_id,id,variant_id,product_id,name,image_url,site_url,search_text,updated_at,price,currency) VALUES($1,$2,$3,$4,'Produto',$5,'https://example.test','produto','2026-11-25',10,'BRL')",
        [batch, variant, variant, `gid://shopify/Product/${product}`, image],
      );
    }
    const rows = [
      photo("missing"),
      photo("snapshot", "1", "1", url("saved")),
      photo("otherVariant", "4", "1"),
      photo("productOnly", null, "1"),
      photo("retired", "9", "9"),
      photo("unsafe", "3", "3"),
      photo("wrongParent", "1", "8"),
    ];
    await fillQueueCatalogPhotos(db, "shop.myshopify.com", rows);
    assert.equal(rows[0].image_url, url("exact"));
    assert.equal(rows[1].image_url, url("saved"));
    assert.equal(rows[2].image_url, null);
    assert.equal(rows[3].image_url, url("exact"));
    assert.equal(rows[4].image_url, null);
    assert.equal(rows[5].image_url, null);
    assert.equal(rows[6].image_url, null);
    const foreign = [photo("foreign")];
    await fillQueueCatalogPhotos(db, "other.myshopify.com", foreign);
    assert.equal(foreign[0].image_url, null);
  } finally {
    await db.close();
  }
});
test("fila continua funcionando sem tabelas do catálogo e sem itens localizáveis", async () => {
  const db = new PGlite();
  try {
    const rows = [photo("no-catalog")];
    await fillQueueCatalogPhotos(db, "shop.myshopify.com", rows);
    assert.equal(rows[0].image_url, null);
  } finally {
    await db.close();
  }
  let calls = 0;
  await fillQueueLivePhotos([photo("gone", null, null)], {
    async query<T>(): Promise<T> {
      calls++;
      return { nodes: [] } as T;
    },
  });
  assert.equal(calls, 0);
});
test("consulta ao vivo agrupa somente IDs ausentes, prefere variante e usa a foto principal", async () => {
  const rows = [
    photo("variant"),
    photo("parent", "2", "2"),
    photo("gone", "3", "3"),
    photo("saved", "4", "4", url("saved")),
    photo("same"),
  ];
  let calls = 0;
  await fillQueueLivePhotos(rows, {
    async query<T>(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<T> {
      calls++;
      assert.match(query, /query QueueProductPhotos/);
      assert.deepEqual(variables?.ids, [
        "gid://shopify/ProductVariant/1",
        "gid://shopify/Product/1",
        "gid://shopify/ProductVariant/2",
        "gid://shopify/Product/2",
        "gid://shopify/ProductVariant/3",
        "gid://shopify/Product/3",
      ]);
      return {
        nodes: [
          {
            id: "gid://shopify/ProductVariant/1",
            image: { url: url("variant") },
            product: {
              id: "gid://shopify/Product/1",
              featuredImage: { url: url("parent-1") },
            },
          },
          {
            id: "gid://shopify/ProductVariant/2",
            image: null,
            product: {
              id: "gid://shopify/Product/2",
              featuredImage: { url: url("parent-2") },
            },
          },
          null,
        ],
      } as T;
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(
    rows.map((row) => row.image_url),
    [url("variant"), url("parent-2"), null, url("saved"), url("variant")],
  );
});
test("não aplica foto de outro produto, URL insegura ou identidade ausente", async () => {
  const rows = [
    photo("wrong"),
    photo("unsafe", "2", "2"),
    photo("deleted-variant", "3", "3"),
  ];
  await fillQueueLivePhotos(rows, {
    async query<T>(): Promise<T> {
      return {
        nodes: [
          {
            id: "gid://shopify/ProductVariant/1",
            image: { url: url("wrong") },
            product: {
              id: "gid://shopify/Product/9",
              featuredImage: { url: url("wrong-parent") },
            },
          },
          {
            id: "gid://shopify/ProductVariant/2",
            image: { url: "http://cdn.shopify.com/insecure.png" },
            product: {
              id: "gid://shopify/Product/2",
              featuredImage: { url: "https://external.test/photo.png" },
            },
          },
          {
            id: "gid://shopify/Product/3",
            featuredImage: { url: url("remaining-product") },
          },
        ],
      } as T;
    },
  });
  assert.deepEqual(
    rows.map((row) => row.image_url),
    [null, null, url("remaining-product")],
  );
});
test("falha do catálogo não altera fotos já existentes nem grava no histórico", async () => {
  const rows = [photo("missing"), photo("saved", "2", "2", url("saved"))];
  await assert.rejects(
    fillQueueLivePhotos(rows, {
      async query() {
        throw new Error("Catálogo indisponível");
      },
    }),
    /Catálogo indisponível/,
  );
  assert.deepEqual(
    rows.map((row) => row.image_url),
    [null, url("saved")],
  );
});
