import type { TEmailType } from '@shinefold/config/constants';

/** A send counted against `siteId`, or against the platform bucket when it has none. */
export interface IEmailSendCount {
  siteId?: string;
  emailType: TEmailType;
}

export interface IEmailSendCountFailure extends IEmailSendCount {
  error: unknown;
}
