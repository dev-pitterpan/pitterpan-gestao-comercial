/** Replace only seasonal/catalog state, preserving framework font and accessibility classes. */
export function catalogDocumentClasses(current: string, next: string[] = []) {
  const transient = new Set([
    "client-page",
    "sidebar-is-open",
    "quote-cart-open",
  ]);
  const retained = current
    .split(/\s+/)
    .filter(
      (name) => name && !name.startsWith("theme-") && !transient.has(name),
    );
  return [...new Set([...retained, ...next.filter(Boolean)])].join(" ");
}
