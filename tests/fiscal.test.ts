import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidNfe,
  readAuthorizedNfe,
} from "../src/shared/server/fiscal/nfe.ts";

const key = "42261100000000000000550010000000421123456789";
const authorization = "342260000000001";
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe><infNFe Id="NFe${key}">
    <ide><mod>55</mod><tpNF>1</tpNF><tpAmb>1</tpAmb><finNFe>1</finNFe></ide>
  </infNFe></NFe>
  <protNFe><infProt><tpAmb>1</tpAmb><chNFe>${key}</chNFe><nProt>${authorization}</nProt><cStat>100</cStat></infProt></protNFe>
</nfeProc>`;

test("lê número, série e protocolo do XML processado", () => {
  assert.deepEqual(readAuthorizedNfe(Buffer.from(xml)), {
    key,
    number: 42,
    series: 1,
    authorization,
  });
});

test("rejeita XML malformado, cancelado, de homologação, sem protocolo ou com chaves diferentes", () => {
  for (const invalid of [
    xml.slice(0, -6),
    xml.replace("<cStat>100</cStat>", "<cStat>101</cStat>"),
    xml.replaceAll("<tpAmb>1</tpAmb>", "<tpAmb>2</tpAmb>"),
    xml.replace(/<protNFe>.*?<\/protNFe>/, ""),
    xml.replace(`Id="NFe${key}"`, 'Id="NFe0"'),
    xml.replace("<mod>55</mod>", "<mod><x/>55</mod>"),
    xml.replace("<mod>55</mod>", "<mod>55</mod><mod>55</mod>"),
    xml.replace("<nfeProc ", "<!DOCTYPE nfeProc><nfeProc "),
  ]) {
    assert.throws(() => readAuthorizedNfe(Buffer.from(invalid)), InvalidNfe);
  }
});
