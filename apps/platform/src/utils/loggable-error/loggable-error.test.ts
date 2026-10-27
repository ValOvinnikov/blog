import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { MOCK_BLOCKED_ADDRESS_HASH } from '@platform/testing/blocked-signups/fixtures';
import {
  MOCK_POSTGRES_ERROR_CODE,
  MOCK_QUERY_ERROR_NAME,
  mockQueryError,
} from '@platform/testing/loggable-error/fixtures';

import { toLoggableError } from './loggable-error';

const MOCK_FAILURE_TEXT = `lookup failed for ${MOCK_SIGN_IN_EMAIL}`;

describe(toLoggableError, () => {
  it('keeps only the name and Postgres code of a failed query', () => {
    const error = mockQueryError(MOCK_SIGN_IN_EMAIL, MOCK_BLOCKED_ADDRESS_HASH);

    expect(toLoggableError(error)).toEqual({
      errorName: MOCK_QUERY_ERROR_NAME,
      errorCode: MOCK_POSTGRES_ERROR_CODE,
    });
  });

  it.each([
    ['no cause', new TypeError(MOCK_FAILURE_TEXT)],
    [
      'a cause without a string code',
      new TypeError(MOCK_FAILURE_TEXT, { cause: { code: 57 } }),
    ],
  ])('names an error with %s and gives no code', (_, error) => {
    expect(toLoggableError(error)).toEqual({
      errorName: TypeError.name,
      errorCode: undefined,
    });
  });

  it('names a thrown value that is not an error by its type', () => {
    expect(toLoggableError(MOCK_FAILURE_TEXT)).toEqual({
      errorName: 'string',
      errorCode: undefined,
    });
  });
});
