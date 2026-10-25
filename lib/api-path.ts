/** Client requests stay in the current mode; production and demo cookies never mix. */
export function apiPath(path: string) {
  return typeof window !== "undefined" && /^\/demo(?:\/|$)/.test(window.location.pathname)
    ? path.replace(/^\/api\//, "/api/demo/") : path;
}
