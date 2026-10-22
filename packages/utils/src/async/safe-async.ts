export type TResult<T, E = unknown> =
  { ok: true; data: T } | { ok: false; error: E };

export function okResult<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

export function errorResult<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}

export function safeAsync<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<TResult<T>> {
  return async (...args: A) => {
    try {
      return okResult(await fn(...args));
    } catch (error) {
      return errorResult(error);
    }
  };
}
