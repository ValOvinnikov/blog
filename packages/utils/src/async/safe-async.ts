export type TResult<T> = { ok: true; data: T } | { ok: false; error: unknown };

export async function safeAsync<T>(promise: Promise<T>): Promise<TResult<T>> {
  try {
    return { ok: true, data: await promise };
  } catch (error) {
    return { ok: false, error };
  }
}
