import type { TValueOf } from '@blog/config/utils';
import type { TSiteConfig } from '@blog/db/schema/site-config';

// Values are site_config column names, so they keep the schema's camelCase.
export const SITE_CONFIG_SAVED_AT = {
  LOOK: 'lookSavedAt',
  VOICE: 'voiceSavedAt',
} as const satisfies Record<string, keyof TSiteConfig>;

export type TSiteConfigSavedAt = TValueOf<typeof SITE_CONFIG_SAVED_AT>;
