// Bounds a long-lived warm instance to one entry per recent client rather than
// one per client it has ever seen.
const MAX_TRACKED_KEYS = 5000;

type TWindowEntry = { count: number; windowStart: number };

export const createInMemoryRateLimitStore = () => {
  const counts = new Map<string, TWindowEntry>();

  const sweepExpired = (now: number, windowMs: number): void => {
    for (const [key, entry] of counts) {
      if (now - entry.windowStart >= windowMs) {
        counts.delete(key);
      }
    }
  };

  // A repeat hit never re-inserts its key, so the Map's first key is the oldest.
  const evictOldest = (): void => {
    const oldestKey = counts.keys().next().value;
    if (oldestKey !== undefined) {
      counts.delete(oldestKey);
    }
  };

  const increment = async (key: string, windowMs: number): Promise<number> => {
    const now = Date.now();
    sweepExpired(now, windowMs);

    const entry = counts.get(key);
    if (entry) {
      entry.count += 1;
      return entry.count;
    }

    if (counts.size >= MAX_TRACKED_KEYS) {
      evictOldest();
    }
    counts.set(key, { count: 1, windowStart: now });
    return 1;
  };

  return { increment };
};
