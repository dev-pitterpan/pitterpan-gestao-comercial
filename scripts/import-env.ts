import { readFile, writeFile, copyFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareEnvironment } from "./env-config.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--from") throw new Error("usage");
  const origin = resolve(args[1]);
  const target = join(root, ".env");
  if (origin.toLowerCase() === target.toLowerCase())
    throw new Error("same_file");
  const packageJson = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  );
  const management = packageJson.name === "pitterpan-gestao-comercial";
  const template = await readFile(join(root, ".env.example"), "utf8");
  const source = await readFile(origin, "utf8");
  let current = "";
  let targetExists = false;
  try {
    current = await readFile(target, "utf8");
    targetExists = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  // Não substitui sobreposições silenciosamente: Next prioriza esses arquivos.
  for (const filename of [
    ".env.local",
    ".env.development",
    ".env.development.local",
  ]) {
    try {
      await stat(join(root, filename));
      console.log(
        `Atenção: ${filename} também pode definir variáveis. Confira suas opções locais.`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const prepared = prepareEnvironment(template, source, current, management);
  if (targetExists)
    await copyFile(
      target,
      `${target}.backup-${Date.now()}`,
      constants.COPYFILE_EXCL,
    );
  // wx evita substituir um arquivo criado enquanto a importação estava em andamento.
  await writeFile(target, prepared.content, {
    encoding: "utf8",
    mode: 0o600,
    flag: targetExists ? "w" : "wx",
  });
  console.log(
    `${management ? "Gestão" : "Catálogo"}: .env preparado. Fonte de produtos: ${prepared.source}; porta local: ${prepared.port}.`,
  );
  if (prepared.issues.length) {
    console.log("Confira estas configurações (nenhum valor foi exibido):");
    for (const issue of prepared.issues) console.log(`- ${issue}`);
    process.exitCode = 1;
  } else
    console.log(
      "Configuração local validada. A conectividade e as permissões da Shopify serão confirmadas ao iniciar o sistema.",
    );
}
main().catch(() => {
  console.error(
    "Não foi possível importar o .env. Use npm run env:import -- --from CAMINHO_DO_ENV_ANTIGO e confira o arquivo de origem e as permissões locais. Nenhuma credencial foi exibida.",
  );
  process.exitCode = 1;
});
