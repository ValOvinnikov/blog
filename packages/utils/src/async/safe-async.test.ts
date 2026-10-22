import { errorResult, okResult, safeAsync, type TResult } from './safe-async';

const ERROR_MESSAGE = 'boom';
const THROWN_STRING = 'string error';

describe('TResult', () => {
  it('defaults the error type param to unknown, not any', () => {
    const result: TResult<number> = { ok: false, error: ERROR_MESSAGE };

    if (!result.ok) {
      // @ts-expect-error -- `error` is `unknown`, so a property access
      // without narrowing must be rejected; `any` would allow this.
      const length: number = result.error.length;

      expect(length).toBe(4);
    }
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

describe(okResult, () => {
  it('wraps the data as a success', () => {
    const result: TResult<number, string> = okResult(42);

    expect(result).toEqual({ ok: true, data: 42 });
  });
});

describe(errorResult, () => {
  it('wraps the error as a failure', () => {
    const error = new Error(ERROR_MESSAGE);
    const result: TResult<number, Error> = errorResult(error);

    expect(result).toEqual({ ok: false, error });
  });
});
