import { isUndefined } from '@shinefold/utils/primitives';

const entries = new Map<string, unknown>();

export const clearNextCache = (): void => entries.clear();

const roundTrip = (value: unknown): unknown =>
  isUndefined(value) ? undefined : JSON.parse(JSON.stringify(value));

// Every read is JSON round-tripped, as a Data Cache hit is, so a `Date` comes back as a string.
export const unstable_cache =
  <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyParts: readonly string[],
  ) =>
  async (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify([keyParts, args]);
    if (!entries.has(key)) entries.set(key, await fn(...args));
    return roundTrip(entries.get(key)) as TResult;
  };
