export const maxDanfeBytes = 800 * 1024;

export function isDanfePdf(bytes: Buffer) {
  return (
    bytes.length <= maxDanfeBytes &&
    /^%PDF-[12]\.\d[\r\n]/.test(bytes.subarray(0, 12).toString("latin1")) &&
    /%%EOF\s*$/.test(bytes.subarray(-1024).toString("latin1"))
  );
}
