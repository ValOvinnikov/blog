export type TResult<T, E = unknown> =
  { ok: true; data: T } | { ok: false; error: E };

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
