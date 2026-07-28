import { safeAsync } from './safe-async';

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

  it('preserves the resolved value type', async () => {
    const result = await safeAsync(() =>
      Promise.resolve({ id: '1', name: 'Alice' }),
    )();
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.name).toBe('Alice');
  });

  it('forwards multiple arguments to the wrapped function', async () => {
    const fn = async (a: number, b: string) => `${b}-${a}`;
    const result = await safeAsync(fn)(1, 'x');
    expect(result).toEqual({ ok: true, data: 'x-1' });
  });
});
