import { safeAsync } from './safe-async';

const ERROR_MESSAGE = 'boom';
const THROWN_STRING = 'string error';

describe('safeAsync', () => {
  it('returns ok:true with resolved data', async () => {
    const result = await safeAsync(() => Promise.resolve(42))();
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it('returns ok:false with the rejection reason', async () => {
    const err = new Error(ERROR_MESSAGE);
    const result = await safeAsync(() => Promise.reject(err))();
    expect(result).toEqual({ ok: false, error: err });
  });

  it('captures non-Error thrown values', async () => {
    const result = await safeAsync(() => Promise.reject(THROWN_STRING))();
    expect(result).toEqual({ ok: false, error: THROWN_STRING });
  });

  it('forwards multiple arguments to the wrapped function', async () => {
    const fn = async (a: number, b: string) => `${b}-${a}`;
    const result = await safeAsync(fn)(1, 'x');
    expect(result).toEqual({ ok: true, data: 'x-1' });
  });
});
