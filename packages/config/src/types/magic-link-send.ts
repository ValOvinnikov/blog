import type { TMagicLinkRefusal } from '@blog/config/constants';

import type { IEmailSendCountFailure } from './email-send-count-failure';

export interface IMagicLinkSendRefusal {
  reason: TMagicLinkRefusal;
  errorName?: string;
  errorCode?: string;
}

export interface IMagicLinkSendHandlers {
  onSendRefused: (refusal: IMagicLinkSendRefusal) => void;
  onSendCountFailed?: (failure: IEmailSendCountFailure) => void;
}
