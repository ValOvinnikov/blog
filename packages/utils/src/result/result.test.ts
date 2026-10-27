import { faker } from '@faker-js/faker';

import { errorResult, okResult, type TResult } from './result';

faker.seed(6029);

const MOCK_ERROR_MESSAGE = faker.lorem.sentence();
const MOCK_NOT_FOUND = 'NOT_FOUND';
const MOCK_VALUE = faker.number.int();

describe('TResult', () => {
  it('defaults the error type param to unknown, not any', () => {
    const result: TResult<number> = { ok: false, error: MOCK_ERROR_MESSAGE };

    if (!result.ok) {
      // @ts-expect-error -- `unknown` rejects an unnarrowed property access
      const length: number = result.error.length;

      expect(length).toBe(MOCK_ERROR_MESSAGE.length);
    }
  });

  it('narrows the error field when a code union is supplied', () => {
    type TCode = typeof MOCK_NOT_FOUND | 'DUPLICATE';

    const result: TResult<number, TCode> = { ok: false, error: MOCK_NOT_FOUND };

    if (!result.ok) {
      const code: TCode = result.error;
      expect(code).toBe(MOCK_NOT_FOUND);
    }
  });
});

describe(okResult, () => {
  it('wraps the data as a success', () => {
    const result: TResult<number, string> = okResult(MOCK_VALUE);

    expect(result).toEqual({ ok: true, data: MOCK_VALUE });
  });

  it('builds a success with no data when called without an argument', () => {
    const result: TResult<void, string> = okResult();

    expect(result).toEqual({ ok: true, data: undefined });
  });
});

describe(errorResult, () => {
  it('wraps the error as a failure', () => {
    const error = new Error(MOCK_ERROR_MESSAGE);
    const result: TResult<number, Error> = errorResult(error);

    expect(result).toEqual({ ok: false, error });
  });

  it('builds a failure with no error when called without an argument', () => {
    const result: TResult<number, string | undefined> = errorResult();

    expect(result).toEqual({ ok: false, error: undefined });
  });
});
