// Like Next's Data Cache: a hit is JSON-parsed, and a thrown callback stores nothing.
export const unstable_cache = <TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) => {
  const entries = new Map<string, string>();
  return async (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify(args);
    const entry = entries.get(key);
    if (entry !== undefined) return JSON.parse(entry) as TResult;

    const result = await fn(...args);
    entries.set(key, JSON.stringify(result));
    return result;
  };
};
