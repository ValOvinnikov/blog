import type { TValueOf } from '@shinefold/config/utils';

export const SETTINGS_FORM_STACK = {
  LOOK: 'LOOK',
  VOICE: 'VOICE',
} as const;

export type TSettingsFormStack = TValueOf<typeof SETTINGS_FORM_STACK>;

export const SAVE_BAR_HEIGHT_PROPERTY = '--platform-save-bar-height';
