/** Derive WebSocket origin for CSP connect-src from Convex HTTP(S) URL. */
export function convexHttpToWebSocketOrigin(httpUrl: string): string {
  const parsed = new URL(httpUrl);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  return parsed.origin;
}
