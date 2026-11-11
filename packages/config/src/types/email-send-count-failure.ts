import type { TEmailType } from '@blog/config/constants';

export interface IEmailSendCountFailure {
  siteId: string;
  emailType: TEmailType;
  error: unknown;
}
