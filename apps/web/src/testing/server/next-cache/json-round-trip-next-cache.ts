import { isUndefined } from '@shinefold/utils/primitives';

type TCacheOptions = { tags?: string[]; revalidate?: number | false };

type TEntry = { value: unknown; tags: string[]; staleAt: number };

const entries = new Map<string, TEntry>();

const SECOND_IN_MS = 1000;

export const clearNextCache = (): void => entries.clear();

export const revalidateTag = (tag: string): void => {
  for (const [key, { tags }] of entries) {
    if (tags.includes(tag)) entries.delete(key);
  }
};

const roundTrip = (value: unknown): unknown =>
  isUndefined(value) ? undefined : JSON.parse(JSON.stringify(value));

const toStaleAt = (revalidate: TCacheOptions['revalidate']): number =>
  revalidate ? Date.now() + revalidate * SECOND_IN_MS : Infinity;

// Every read is JSON round-tripped, as a Data Cache hit is, so a `Date` comes back as a string.
export const unstable_cache =
  <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyParts: readonly string[],
    { tags = [], revalidate }: TCacheOptions = {},
  ) =>
  async (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify([keyParts, args]);
    const entry = entries.get(key);
    if (!entry || Date.now() >= entry.staleAt) {
      const value = await fn(...args);
      entries.set(key, { value, tags, staleAt: toStaleAt(revalidate) });
      return roundTrip(value) as TResult;
    }
    return roundTrip(entry.value) as TResult;
  };
