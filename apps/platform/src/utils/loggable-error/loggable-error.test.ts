import { STRIPE_ERROR_CODE } from '@platform/constants/billing';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { MOCK_BLOCKED_ADDRESS_HASH } from '@platform/testing/blocked-signups/fixtures';
import {
  MOCK_POSTGRES_ERROR_CODE,
  MOCK_QUERY_ERROR_NAME,
  MOCK_RESEND_ERROR_CODE,
  MOCK_STRIPE_REQUEST_ID,
  mockQueryError,
} from '@platform/testing/loggable-error/fixtures';
import { HTTP_STATUS } from '@shinefold/config/constants';
import { SendEmailError } from '@shinefold/email';
import Stripe from 'stripe';

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

  it('keeps a Stripe error type, code, status and request id but not its message', () => {
    const error = new Stripe.errors.StripeInvalidRequestError({
      message: MOCK_FAILURE_TEXT,
      param: MOCK_SIGN_IN_EMAIL,
      code: STRIPE_ERROR_CODE.RESOURCE_MISSING,
      statusCode: HTTP_STATUS.NOT_FOUND,
      requestId: MOCK_STRIPE_REQUEST_ID,
    });

    expect(toLoggableError(error)).toEqual({
      errorName: Error.name,
      errorCode: STRIPE_ERROR_CODE.RESOURCE_MISSING,
      errorType: Stripe.errors.StripeInvalidRequestError.name,
      statusCode: HTTP_STATUS.NOT_FOUND,
      requestId: MOCK_STRIPE_REQUEST_ID,
    });
  });

  it('keeps a Resend failure code and status but not its message', () => {
    const error = new SendEmailError(
      MOCK_FAILURE_TEXT,
      HTTP_STATUS.BAD_REQUEST,
      MOCK_RESEND_ERROR_CODE,
    );

    expect(toLoggableError(error)).toEqual({
      errorName: SendEmailError.name,
      errorCode: MOCK_RESEND_ERROR_CODE,
      statusCode: HTTP_STATUS.BAD_REQUEST,
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
