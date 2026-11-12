import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const docsPath = "docs/SISTEMA.md";
assert.ok(
  readFileSync(docsPath, "utf8").trim(),
  "O mapa do sistema está vazio.",
);

const base = process.env.DOCS_BASE;
if (base && /^[a-f0-9]{40}$/.test(base) && !/^0+$/.test(base)) {
  const files = execFileSync("git", ["diff", "--name-only", base, "HEAD"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  if (
    files.some((file) =>
      /^(src\/|scripts\/|config\/|public\/|vercel\.json$|next\.config\.ts$|package\.json$)/.test(
        file,
      ),
    )
  ) {
    assert.ok(
      files.includes(docsPath),
      "Atualize docs/SISTEMA.md na mesma alteração.",
    );
  }
}
console.log("Documentação do sistema verificada.");
