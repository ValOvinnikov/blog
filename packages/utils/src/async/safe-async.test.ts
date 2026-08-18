import { safeAsync, type TResult } from './safe-async';

describe('TResult', () => {
  it('defaults the error type param to unknown, matching an explicit TResult<T, unknown>', () => {
    const withDefault: TResult<number> = { ok: false, error: 'boom' };
    const withExplicitUnknown: TResult<number, unknown> = withDefault;

    expect(withExplicitUnknown).toEqual(withDefault);
  });

  it('narrows the error field when a code union is supplied', () => {
    type TCode = 'NOT_FOUND' | 'DUPLICATE';

    const result: TResult<number, TCode> = { ok: false, error: 'NOT_FOUND' };

    if (!result.ok) {
      const code: TCode = result.error;
      expect(code).toBe('NOT_FOUND');
    }
  });
});

describe('safeAsync', () => {
  it('returns ok:true with resolved data', async () => {
    const result = await safeAsync(() => Promise.resolve(42))();
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it('returns ok:false with the rejection reason', async () => {
    const err = new Error('boom');
    const result = await safeAsync(() => Promise.reject(err))();
    expect(result).toEqual({ ok: false, error: err });
  });

  it('captures non-Error thrown values', async () => {
    const result = await safeAsync(() => Promise.reject('string error'))();
    expect(result).toEqual({ ok: false, error: 'string error' });
  });

  it('forwards multiple arguments to the wrapped function', async () => {
    const fn = async (a: number, b: string) => `${b}-${a}`;
    const result = await safeAsync(fn)(1, 'x');
    expect(result).toEqual({ ok: true, data: 'x-1' });
  });
});
