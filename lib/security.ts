/** Production origin is explicit; do not trust arbitrary forwarded host headers. */
export function isAllowedOrigin(
  origin: string | null,
  host: string | null,
  configuredOrigin?: string,
): boolean {
  if (!origin || !host) return false;
  try {
    const actual = new URL(origin);
    if (origin !== actual.origin) return false;
    if (configuredOrigin)
      return actual.origin === new URL(configuredOrigin).origin;
    return (
      ["http:", "https:"].includes(actual.protocol) && actual.host === host
    );
  } catch {
    return false;
  }
}
export function publicOrigin() {
  return (
    process.env.PUBLIC_ORIGIN ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined)
  );
}
export function secureCookie() {
  return (
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false")
  );
}
