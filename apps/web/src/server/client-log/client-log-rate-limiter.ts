const WINDOW_MS = 60_000;

// Exported so the test suite can exercise the exact bound instead of
// duplicating it as a magic number.
export const MAX_REQUESTS_PER_WINDOW = 20;

// Hard ceiling on distinct tracked client keys, so a long-lived warm
// instance can't accumulate one permanent `Map` entry per visitor IP it has
// ever seen. The sweep below already frees expired entries; this bounds the
// *in-window* size too, evicting the oldest tracked entry once full.
export const MAX_TRACKED_CLIENTS = 5000;

type TWindowEntry = { count: number; windowStart: number };

const requestCounts = new Map<string, TWindowEntry>();

const isExpired = (entry: TWindowEntry, now: number): boolean => {
  return now - entry.windowStart >= WINDOW_MS;
};

// O(n) over currently-tracked clients, run on every call — cheap enough for
// a single lightweight endpoint's limiter. Frees an expired entry
// immediately rather than leaving it to linger until evicted for space.
const sweepExpiredEntries = (now: number): void => {
  for (const [key, entry] of requestCounts) {
    if (isExpired(entry, now)) {
      requestCounts.delete(key);
    }
  }
};

// `Map` iterates in insertion order and a repeat hit never re-inserts an
// existing key (see `isClientLogRateLimited` below), so the first key here
// is the oldest still-tracked client — a simple FIFO choice once the cap
// is reached.
const evictOldestEntry = (): void => {
  const oldestKey = requestCounts.keys().next().value;
  if (oldestKey !== undefined) {
    requestCounts.delete(oldestKey);
  }
};

/**
 * Fixed-window, per-client-key limiter backed by a module-level `Map` — the
 * only rate-limiting this repo has today, built for `/api/client-log`
 * specifically since it's the app's first unauthenticated public write
 * endpoint. Deliberately not a hard global ceiling: it lives in one
 * serverless instance's memory, so a client whose requests land on
 * different instances (Vercel routes by nothing this app controls) gets a
 * fresh counter on each one — that blunts a single instance getting
 * hammered, not a guarantee across the fleet.
 *
 * It's also not spoof-proof at scale: an attacker who drives traffic from
 * `MAX_TRACKED_CLIENTS`+ genuinely distinct source IPs inside one window can
 * force-evict a legitimate client's in-window counter, resetting its limit.
 * High-cost for an attacker and acceptable for v1 — but a real limitation,
 * not just a caveat.
 */
export const isClientLogRateLimited = (clientKey: string): boolean => {
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
};

// Test-only: the raw tracked-client count, exposed because it's the only
// way to unambiguously prove the sweep frees Map capacity on its own,
// independent of `MAX_TRACKED_CLIENTS` eviction (see the rate-limiter test
// suite for why the boolean return value alone can't distinguish the two).
export const getTrackedClientCountForTests = (): number => {
  return requestCounts.size;
};
