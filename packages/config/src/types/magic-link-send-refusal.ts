import type { TMagicLinkRefusal } from '@blog/config/constants';

export interface IMagicLinkSendRefusal {
  reason: TMagicLinkRefusal;
  error?: unknown;
}
