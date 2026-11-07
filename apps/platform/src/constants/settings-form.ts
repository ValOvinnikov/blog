import type { TValueOf } from '@blog/config/utils';

export const SETTINGS_FORM_STACK = {
  LOOK: 'LOOK',
  VOICE: 'VOICE',
} as const;

export type TSettingsFormStack = TValueOf<typeof SETTINGS_FORM_STACK>;

export const SAVE_BAR_HEIGHT_PROPERTY = '--admin-save-bar-height';
