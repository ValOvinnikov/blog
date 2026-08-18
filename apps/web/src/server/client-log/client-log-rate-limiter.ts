const WINDOW_MS = 60_000;

// Exported so the test suite can exercise the exact bound instead of
// duplicating it as a magic number.
export const MAX_REQUESTS_PER_WINDOW = 20;

// Hard ceiling on distinct tracked client keys. Without this, a long-lived
// warm serverless instance accumulates one permanent `Map` entry per
// distinct visitor IP it has ever seen — a memory leak in the mitigation
// itself, even under only-legitimate traffic. The per-call sweep below
// drops any entry whose window has already elapsed, but that alone doesn't
// bound the *in-window* size during a flood from many distinct IPs inside
// the same window — this cap does, by evicting the oldest tracked entry
// once the `Map` is full.
export const MAX_TRACKED_CLIENTS = 5000;

type TWindowEntry = { count: number; windowStart: number };

const requestCounts = new Map<string, TWindowEntry>();

function isExpired(entry: TWindowEntry, now: number): boolean {
  return now - entry.windowStart >= WINDOW_MS;
}

// O(n) over currently-tracked clients, run on every call — acceptable for a
// single lightweight endpoint's in-memory limiter, and it's what keeps the
// bound in `MAX_TRACKED_CLIENTS` meaningful: a key whose window has already
// elapsed is freed immediately rather than lingering until it happens to be
// evicted for space.
function sweepExpiredEntries(now: number): void {
  for (const [key, entry] of requestCounts) {
    if (isExpired(entry, now)) {
      requestCounts.delete(key);
    }
  }
}

// `Map` iterates in insertion order and re-requests of an existing key never
// re-insert it (see `isClientLogRateLimited` below), so the first key here
// is the oldest still-tracked client — a simple, deterministic FIFO choice
// once the tracked-client cap is reached.
function evictOldestEntry(): void {
  const oldestKey = requestCounts.keys().next().value;
  if (oldestKey !== undefined) {
    requestCounts.delete(oldestKey);
  }
}

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
  sweepExpiredEntries(now);

  const entry = requestCounts.get(clientKey);
  if (entry) {
    entry.count += 1;
    return entry.count > MAX_REQUESTS_PER_WINDOW;
  }

  if (requestCounts.size >= MAX_TRACKED_CLIENTS) {
    evictOldestEntry();
  }
  requestCounts.set(clientKey, { count: 1, windowStart: now });
  return false;
}
