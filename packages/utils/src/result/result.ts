export type TResult<T, E = unknown> =
  { ok: true; data: T } | { ok: false; error: E };

export function okResult(): { ok: true; data: undefined };
export function okResult<T>(data: T): { ok: true; data: T };
export function okResult<T>(data?: T): { ok: true; data: T | undefined } {
  return { ok: true, data };
}

export function errorResult(): { ok: false; error: undefined };
export function errorResult<E>(error: E): { ok: false; error: E };
export function errorResult<E>(error?: E): {
  ok: false;
  error: E | undefined;
} {
  return { ok: false, error };
}
