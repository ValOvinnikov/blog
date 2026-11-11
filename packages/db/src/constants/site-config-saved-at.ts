import type { TValueOf } from '@blog/config/utils';

export const SITE_CONFIG_SAVED_AT = {
  LOOK: 'LOOK',
  VOICE: 'VOICE',
} as const;

export type TSiteConfigSavedAt = TValueOf<typeof SITE_CONFIG_SAVED_AT>;
