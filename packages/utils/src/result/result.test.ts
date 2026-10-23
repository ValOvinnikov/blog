import { errorResult, okResult, type TResult } from './result';

const ERROR_MESSAGE = 'failed';
const NOT_FOUND = 'NOT_FOUND';
const VALUE = 42;

describe('TResult', () => {
  it('defaults the error type param to unknown, not any', () => {
    const result: TResult<number> = { ok: false, error: ERROR_MESSAGE };

    if (!result.ok) {
      // @ts-expect-error -- `unknown` rejects an unnarrowed property access
      const length: number = result.error.length;

      expect(length).toBe(ERROR_MESSAGE.length);
    }
  });

  it('narrows the error field when a code union is supplied', () => {
    type TCode = typeof NOT_FOUND | 'DUPLICATE';

    const result: TResult<number, TCode> = { ok: false, error: NOT_FOUND };

    if (!result.ok) {
      const code: TCode = result.error;
      expect(code).toBe(NOT_FOUND);
    }
  });
});

describe(okResult, () => {
  it('wraps the data as a success', () => {
    const result: TResult<number, string> = okResult(VALUE);

    expect(result).toEqual({ ok: true, data: VALUE });
  });

  it('builds a success with no data when called without an argument', () => {
    const result: TResult<void, string> = okResult();

    expect(result).toEqual({ ok: true, data: undefined });
  });
});

describe(errorResult, () => {
  it('wraps the error as a failure', () => {
    const error = new Error(ERROR_MESSAGE);
    const result: TResult<number, Error> = errorResult(error);

    expect(result).toEqual({ ok: false, error });
  });

  it('builds a failure with no error when called without an argument', () => {
    const result: TResult<number, string | undefined> = errorResult();

    expect(result).toEqual({ ok: false, error: undefined });
  });
});
