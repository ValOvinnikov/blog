import type { TEmailType } from '@shinefold/config/constants';

export interface IEmailSendCountFailure {
  siteId: string;
  emailType: TEmailType;
  error: unknown;
}
