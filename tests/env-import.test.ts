import test from "node:test";
import assert from "node:assert/strict";
import { parseEnv } from "node:util";
import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  cp,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { prepareEnvironment } from "../scripts/env-config.ts";
const source = `PORT=3001\nCATALOG_DATA_SOURCE=shopify\nSHOPIFY_STORE_DOMAIN=fixture.myshopify.com\nSHOPIFY_API_VERSION=2026-07\nSHOPIFY_CLIENT_ID=product-fixture\nSHOPIFY_CLIENT_SECRET=secret-fixture\nDATABASE_URL=postgresql://fixture:fake@localhost/fixture\nADMIN_EMAIL=fixture@example.test\nADMIN_NAME="Equipe # 1"\nADMIN_PASSWORD_HASH=scrypt$${"a".repeat(32)}$${"b".repeat(128)}\nADMIN_SESSION_SECRET=${"s".repeat(48)}\nSHOPIFY_SALES_STORE_DOMAIN=fixture.myshopify.com\nSHOPIFY_SALES_CLIENT_ID=sales-fixture\nSHOPIFY_SALES_CLIENT_SECRET=sales-secret-fixture\nSHOPIFY_SALES_API_VERSION=2026-10\nUNRELATED_SECRET=never-copy\n`;
const catalogTemplate = `HOST=127.0.0.1\nPORT=3000\nNEXT_PUBLIC_CATALOG_URL=http://127.0.0.1:3000\nCATALOG_DATA_SOURCE=shopify\nDATABASE_URL=\nSHOPIFY_STORE_DOMAIN=\nSHOPIFY_API_VERSION=2026-07\nSHOPIFY_ADMIN_ACCESS_TOKEN=\nSHOPIFY_CLIENT_ID=\nSHOPIFY_CLIENT_SECRET=\n`;
const managementTemplate =
  catalogTemplate +
  `ADMIN_EMAIL=\nADMIN_NAME=\nADMIN_PASSWORD_HASH=\nADMIN_SESSION_SECRET=\nSHOPIFY_SALES_STORE_DOMAIN=\nSHOPIFY_SALES_CLIENT_ID=\nSHOPIFY_SALES_CLIENT_SECRET=\nSHOPIFY_SALES_API_VERSION=2026-10\nCRON_SECRET=\nJITSI_BASE_URL=\n`;
test("catálogo importa só suas chaves e corrige a porta herdada sem receber credenciais administrativas", () => {
  const result = prepareEnvironment(catalogTemplate, source, "", false),
    values = parseEnv(result.content);
  assert.deepEqual(result.issues, []);
  assert.equal(values.PORT, "3000");
  assert.equal(values.SHOPIFY_CLIENT_ID, "product-fixture");
  assert.equal(values.ADMIN_SESSION_SECRET, undefined);
  assert.equal(values.SHOPIFY_SALES_CLIENT_SECRET, undefined);
  assert.equal(values.UNRELATED_SECRET, undefined);
  assert.equal(values.NEXT_PUBLIC_CATALOG_URL, "http://127.0.0.1:3000");
});
test("gestão mantém produtos e vendas separados e preserva hash sem expansão de dólar", () => {
  const result = prepareEnvironment(managementTemplate, source, "", true),
    values = parseEnv(result.content);
  assert.deepEqual(result.issues, []);
  assert.equal(values.PORT, "3001");
  assert.equal(values.SHOPIFY_CLIENT_ID, "product-fixture");
  assert.equal(values.SHOPIFY_SALES_CLIENT_ID, "sales-fixture");
  assert.equal(
    values.ADMIN_PASSWORD_HASH,
    `scrypt:${"a".repeat(32)}:${"b".repeat(128)}`,
  );
  assert.equal(values.ADMIN_NAME, "Equipe # 1");
  const missing = prepareEnvironment(
    managementTemplate,
    source.replace(
      /SHOPIFY_SALES_CLIENT_SECRET=.*/g,
      "SHOPIFY_SALES_CLIENT_SECRET=",
    ),
    "",
    true,
  );
  assert.ok(missing.issues.includes("SHOPIFY_SALES_CLIENT_SECRET ausente"));
});
test("importação preserva valores já preenchidos e avisa sobre configurações incompletas", () => {
  const result = prepareEnvironment(
      catalogTemplate,
      source,
      'SHOPIFY_CLIENT_SECRET="local-existing"\nPORT=4200\nCATALOG_DATA_SOURCE=postgres\n',
      false,
    ),
    values = parseEnv(result.content);
  assert.equal(values.PORT, "4200");
  assert.equal(values.SHOPIFY_CLIENT_SECRET, "local-existing");
  assert.equal(values.CATALOG_DATA_SOURCE, "postgres");
  const missing = prepareEnvironment(managementTemplate, "", "", true);
  assert.ok(missing.issues.includes("DATABASE_URL ausente ou inválida"));
  assert.ok(missing.issues.includes("ADMIN_PASSWORD_HASH ausente ou inválido"));
});
test("CLI cria backup, aceita caminhos com espaços e não imprime credenciais", async () => {
  const root = await mkdtemp(join(tmpdir(), "pitterpan-env-test-"));
  try {
    await mkdir(join(root, "scripts"));
    for (const file of ["env-config.ts", "import-env.ts"])
      await cp(
        new URL(`../scripts/${file}`, import.meta.url),
        join(root, "scripts", file),
      );
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ type: "module", name: "pitterpan-catalogo-digital" }),
    );
    await writeFile(join(root, ".env.example"), catalogTemplate);
    await writeFile(
      join(root, ".env"),
      'SHOPIFY_CLIENT_SECRET="existing-secret-fixture"\n',
    );
    const origin = join(root, "old config.env");
    await writeFile(origin, source);
    const output = execFileSync(
      process.execPath,
      [join(root, "scripts/import-env.ts"), "--from", origin],
      { encoding: "utf8" },
    );
    assert.ok(!output.includes("existing-secret-fixture"));
    assert.ok(!output.includes("sales-secret-fixture"));
    assert.ok(!output.includes("secret-fixture"));
    assert.equal(
      parseEnv(await readFile(join(root, ".env"), "utf8"))
        .SHOPIFY_CLIENT_SECRET,
      "existing-secret-fixture",
    );
    assert.equal(
      (await readdir(root)).filter((x) => x.startsWith(".env.backup-")).length,
      1,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
