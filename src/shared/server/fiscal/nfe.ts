import { SaxesParser } from "saxes";

const namespace = "http://www.portalfiscal.inf.br/nfe";
const invoice = "/nfeProc/NFe/infNFe";
const protocol = "/nfeProc/protNFe/infProt";
export const maxNfeBytes = 800 * 1024;

export class InvalidNfe extends Error {}

export function readAuthorizedNfe(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > maxNfeBytes) {
    throw new InvalidNfe("Selecione um XML de até 800 KB.");
  }

  function invalid(): never {
    throw new InvalidNfe(
      "Use o XML processado de uma NF-e modelo 55 de saída com protocolo de autorização.",
    );
  }

  const xml = (() => {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new InvalidNfe(
        "Exporte novamente o XML do emissor no formato UTF-8.",
      );
    }
  })();

  const fields = new Map<string, string>([
    [invoice + "/ide/mod", ""],
    [invoice + "/ide/tpAmb", ""],
    [invoice + "/ide/tpNF", ""],
    [invoice + "/ide/finNFe", ""],
    [protocol + "/chNFe", ""],
    [protocol + "/tpAmb", ""],
    [protocol + "/cStat", ""],
    [protocol + "/nProt", ""],
  ]);
  const seen = new Set<string>();
  const stack: string[] = [];
  let invoiceId = "";
  const parser = new SaxesParser({ xmlns: true });
  parser.on("error", invalid);
  parser.on("doctype", invalid);
  parser.on("opentag", (tag) => {
    if (stack.length >= 64 || fields.has(stack.join(""))) invalid();
    stack.push(tag.uri === namespace ? "/" + tag.local : "/?");
    const path = stack.join("");
    if (stack.length === 1 && path !== "/nfeProc") invalid();
    if (path === invoice || path === protocol || fields.has(path)) {
      if (seen.has(path)) invalid();
      seen.add(path);
    }
    if (path === invoice) {
      const id = tag.attributes.Id;
      invoiceId = id?.value ?? "";
    }
  });
  function collect(value: string) {
    const path = stack.join("");
    const current = fields.get(path);
    if (current === undefined) return;
    if (current.length + value.length > 128) invalid();
    fields.set(path, current + value);
  }
  parser.on("text", collect);
  parser.on("cdata", collect);
  parser.on("closetag", () => stack.pop());
  parser.write(xml).close();

  const key = fields.get(protocol + "/chNFe")?.trim() ?? "";
  const authorization = fields.get(protocol + "/nProt")?.trim() ?? "";
  const status = fields.get(protocol + "/cStat")?.trim() ?? "";
  if (
    !/^\d{44}$/.test(key) ||
    invoiceId !== "NFe" + key ||
    key.slice(20, 22) !== "55" ||
    fields.get(invoice + "/ide/mod")?.trim() !== "55" ||
    fields.get(invoice + "/ide/tpAmb")?.trim() !== "1" ||
    fields.get(protocol + "/tpAmb")?.trim() !== "1" ||
    fields.get(invoice + "/ide/tpNF")?.trim() !== "1" ||
    fields.get(invoice + "/ide/finNFe")?.trim() !== "1" ||
    !["100", "150"].includes(status) ||
    !/^\d{15,17}$/.test(authorization)
  ) {
    invalid();
  }

  return {
    key,
    authorization,
    number: Number(key.slice(25, 34)),
    series: Number(key.slice(22, 25)),
  };
}
