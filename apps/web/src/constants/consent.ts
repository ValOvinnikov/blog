import type { TValueOf } from '@blog/config/utils';

export const CONSENT_STATUS = {
  UNKNOWN: 'UNKNOWN',
  UNANSWERED: 'UNANSWERED',
  ANSWERED: 'ANSWERED',
  GRANTED: 'GRANTED',
  DENIED: 'DENIED',
} as const;

export type TConsentStatus = TValueOf<typeof CONSENT_STATUS>;

export const CONSENT_LOG = {
  MODULE_FETCH_FAILED: 'cookie_settings_module.fetch_failed',
} as const;
