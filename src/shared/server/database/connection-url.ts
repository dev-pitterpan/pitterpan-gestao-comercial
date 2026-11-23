/** Keep pg 8's existing certificate verification explicit across future driver upgrades. */
export function databaseConnectionString(value: string) {
  const input = value.trim();
  try {
    const url = new URL(input);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) return input;
    if (url.searchParams.get("uselibpqcompat") === "true") return input;
    if (
      ["prefer", "require", "verify-ca"].includes(
        url.searchParams.get("sslmode") || "",
      )
    ) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    // The driver remains responsible for validation; never log connection URLs.
  }
  return input;
}
