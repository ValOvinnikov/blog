import type { TValueOf } from '@blog/config/utils';

export const SETTINGS_REFUSAL = {
  NOT_IN_PLAN: 'NOT_IN_PLAN',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type TSettingsRefusal = TValueOf<typeof SETTINGS_REFUSAL>;
