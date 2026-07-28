export type TResult<T> = { ok: true; data: T } | { ok: false; error: unknown };

export function safeAsync<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<TResult<T>> {
  return async (...args: A) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (error) {
      return { ok: false, error };
    }
  };
}
