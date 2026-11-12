export const catalogImagesSchema = `CREATE TABLE IF NOT EXISTS pitterpan_catalog_images (
  source text PRIMARY KEY, name text NOT NULL, sku text NOT NULL,
  status text NOT NULL CHECK (status IN ('completed','failed')),
  original_format text, original_width integer, original_height integer,
  original_bytes integer, webp_bytes integer, webp bytea, error text,
  processed_at timestamptz NOT NULL DEFAULT now()
);`;
