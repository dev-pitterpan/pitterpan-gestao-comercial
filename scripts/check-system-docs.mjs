import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const releasesPath = "src/shared/config/system-releases.json";
const docsPath = "docs/SISTEMA.md";
const releases = JSON.parse(readFileSync(releasesPath, "utf8"));
assert.ok(
  readFileSync(docsPath, "utf8").trim(),
  "O mapa do sistema está vazio.",
);
assert.ok(
  Array.isArray(releases) && releases.length,
  "Registre a versão do sistema.",
);
const versions = new Set();
for (const [index, entry] of releases.entries()) {
  assert.match(entry.version, /^\d{4}\.\d{2}\.\d{2}\.\d+$/);
  assert.match(entry.recordedAt, /(?:Z|[+-]\d{2}:\d{2})$/);
  assert.ok(Number.isFinite(Date.parse(entry.recordedAt)));
  assert.ok(!versions.has(entry.version), "Versão duplicada.");
  assert.ok(
    entry.title?.trim() &&
      entry.changes?.length &&
      entry.changes.every((change) => change.trim()),
  );
  if (index)
    assert.ok(
      Date.parse(releases[index - 1].recordedAt) >=
        Date.parse(entry.recordedAt),
      "Ordene da versão mais recente para a mais antiga.",
    );
  versions.add(entry.version);
}

const base = process.env.DOCS_BASE;
if (base && /^[a-f0-9]{40}$/.test(base) && !/^0+$/.test(base)) {
  const files = execFileSync("git", ["diff", "--name-only", base, "HEAD"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  if (
    files.some(
      (file) =>
        /^(src\/|scripts\/|config\/|public\/|vercel\.json$|next\.config\.ts$|package\.json$)/.test(
          file,
        ) && file !== releasesPath,
    )
  ) {
    assert.ok(
      files.includes(docsPath) && files.includes(releasesPath),
      "Atualize docs/SISTEMA.md e o registro de versões na mesma alteração.",
    );
    const previous = execFileSync(
      "git",
      ["ls-tree", "--name-only", base, "--", releasesPath],
      { encoding: "utf8" },
    ).trim();
    if (previous) {
      const oldReleases = JSON.parse(
        execFileSync("git", ["show", `${base}:${releasesPath}`], {
          encoding: "utf8",
        }),
      );
      assert.ok(
        !oldReleases.some((entry) => entry.version === releases[0].version),
        "Adicione uma nova versão no início do histórico.",
      );
      for (const entry of oldReleases)
        assert.ok(
          versions.has(entry.version),
          "Preserve as versões já registradas.",
        );
    }
  }
}
console.log("Documentação e versões verificadas.");
