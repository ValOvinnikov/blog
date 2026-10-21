import 'server-only';

type TWindowEntry = { count: number; expiresAt: number };

export const createInMemoryRateLimitStore = () => {
  const counts = new Map<string, TWindowEntry>();

  const increment = async (
    key: string,
    windowMs: number,
    now = Date.now(),
  ): Promise<number> => {
    for (const [trackedKey, entry] of counts) {
      if (now >= entry.expiresAt) counts.delete(trackedKey);
    }

    const entry = counts.get(key);
    if (entry) {
      entry.count += 1;
      return entry.count;
    }

    counts.set(key, { count: 1, expiresAt: now + windowMs });
    return 1;
  };

  return { increment };
};
