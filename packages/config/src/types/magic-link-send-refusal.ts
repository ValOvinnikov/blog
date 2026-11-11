import type { IEmailSendCountFailure } from '@blog/config/types/email-send-count-failure';

import type { TMagicLinkRefusal } from '@blog/config/constants';

export interface IMagicLinkSendRefusal {
  reason: TMagicLinkRefusal;
  errorName?: string;
  errorCode?: string;
}

export interface IMagicLinkSendHandlers {
  onSendRefused: (refusal: IMagicLinkSendRefusal) => void;
  onSendCountFailed?: (failure: IEmailSendCountFailure) => void;
}
