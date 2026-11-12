import { isRetryableSendError, SendEmailError } from './send-email-error';

const MOCK_MESSAGE = 'Resend said no';

describe(isRetryableSendError, () => {
  it.each([
    ['a network failure Resend never answered', null, 'application_error'],
    ['the rate limit', 429, 'rate_limit_exceeded'],
    ['a daily quota', 429, 'daily_quota_exceeded'],
    ['a Resend outage', 500, 'internal_server_error'],
  ])('retries %s', (_, statusCode, code) => {
    expect(
      isRetryableSendError(new SendEmailError(MOCK_MESSAGE, statusCode, code)),
    ).toBe(true);
  });

  it.each([
    ['a rejected address', 422, 'validation_error'],
    ['a bad From address', 422, 'invalid_from_address'],
    ['a refused key', 403, 'invalid_api_key'],
  ])('gives up on %s', (_, statusCode, code) => {
    expect(
      isRetryableSendError(new SendEmailError(MOCK_MESSAGE, statusCode, code)),
    ).toBe(false);
  });

  it('gives up on an error that is not a send failure', () => {
    expect(isRetryableSendError(new Error(MOCK_MESSAGE))).toBe(false);
  });
});
