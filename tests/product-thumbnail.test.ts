import test from "node:test";
import assert from "node:assert/strict";
import {
  productThumbnailSources,
  productPlaceholder,
} from "../src/shared/lib/admin/product-thumbnail.ts";
test("thumbnail tenta a foto atual, original e histórica antes do placeholder", () => {
  const current = "https://cdn.shopify.com/current.jpg?v=2",
    historical = "https://cdn.shopify.com/old.jpg?v=1";
  assert.deepEqual(productThumbnailSources(current, historical), [
    current + "&width=120",
    current,
    historical + "&width=120",
    historical,
    productPlaceholder,
  ]);
});
test("thumbnail sem foto ou com fontes repetidas não repete o placeholder", () => {
  assert.deepEqual(productThumbnailSources(null), [productPlaceholder]);
  assert.deepEqual(
    productThumbnailSources(productPlaceholder, productPlaceholder),
    [productPlaceholder],
  );
  const source = "https://cdn.shopify.com/photo.jpg?width=120";
  assert.deepEqual(productThumbnailSources(source, source), [
    source,
    productPlaceholder,
  ]);
});
