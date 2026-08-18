const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const requestCounts = new Map<string, { count: number; windowStart: number }>();

/**
 * Fixed-window, per-client-key limiter backed by a module-level `Map` — the
 * only rate-limiting this repo has today, built for `/api/client-log`
 * specifically since it's the app's first unauthenticated public write
 * endpoint. Deliberately not a hard global ceiling: it lives in one
 * serverless instance's memory, so a client whose requests land on
 * different instances (Vercel routes by nothing this app controls) gets a
 * fresh counter on each one. That's an acceptable v1 trade — it blunts a
 * single instance getting hammered by one client, not a guarantee across
 * the fleet — but it is a real limitation, not just a caveat.
 */
export function isClientLogRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(clientKey);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    requestCounts.set(clientKey, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}
