import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { catalogImagesSchema } from "../../src/shared/server/catalog-images/schema.ts";
import { database } from "../../src/shared/server/database/client.ts";
if (existsSync(new URL("../../.env", import.meta.url)))
  process.loadEnvFile(new URL("../../.env", import.meta.url));
const db = database();
try {
  await db.query(
    await readFile(
      new URL("../../src/shared/server/database/schema.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.query(catalogImagesSchema);
  console.log("Estrutura PostgreSQL criada/verificada.");
} finally {
  await db.end();
}
