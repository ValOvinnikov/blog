import type { TValueOf } from '@blog/config/utils';

export const VOICE_SECTION = {
  ERROR_PAGES: 'ERROR_PAGES',
  EMPTY_STATES: 'EMPTY_STATES',
} as const;

export type TVoiceSection = TValueOf<typeof VOICE_SECTION>;
