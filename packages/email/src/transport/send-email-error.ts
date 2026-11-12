import { isNull } from '@blog/utils/primitives';

const RETRYABLE_STATUS_FLOOR = 500;
const TOO_MANY_REQUESTS = 429;

/** A failed Resend send, carrying Resend's status and error name so a caller can tell a retry from a lost cause. */
export class SendEmailError extends Error {
  readonly statusCode: number | null;
  readonly code: string;

  constructor(message: string, statusCode: number | null, code: string) {
    super(`Failed to send email via Resend: ${message}`);
    this.name = 'SendEmailError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// A null status is a network failure Resend never answered; 429 covers the rate limit and both quotas.
export function isRetryableSendError(error: unknown): boolean {
  if (!(error instanceof SendEmailError)) return false;
  const { statusCode } = error;
  return (
    isNull(statusCode) ||
    statusCode === TOO_MANY_REQUESTS ||
    statusCode >= RETRYABLE_STATUS_FLOOR
  );
}
