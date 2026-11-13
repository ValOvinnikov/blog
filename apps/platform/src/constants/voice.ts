import { VOICE_SURFACE, type TVoiceSurface } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';

export const VOICE_SECTION = {
  ERROR_PAGES: 'ERROR_PAGES',
  EMPTY_STATES: 'EMPTY_STATES',
} as const;

export type TVoiceSection = TValueOf<typeof VOICE_SECTION>;

export const VOICE_COUNT_UNIT = {
  LISTS: 'LISTS',
  FIELDS: 'FIELDS',
} as const;

export type TVoiceCountUnit = TValueOf<typeof VOICE_COUNT_UNIT>;

export const VOICE_SECTION_ID = {
  [VOICE_SECTION.ERROR_PAGES]: {
    section: 'sec-errors',
    heading: 'sec-errors-t',
    body: 'sec-errors-body',
  },
  [VOICE_SECTION.EMPTY_STATES]: {
    section: 'sec-empty',
    heading: 'sec-empty-t',
    body: 'sec-empty-body',
  },
} as const satisfies Record<
  TVoiceSection,
  { section: string; heading: string; body: string }
>;

export const VOICE_CARD_ID = {
  [VOICE_SURFACE.NOT_FOUND]: { card: 's-notfound', heading: 's-notfound-t' },
  [VOICE_SURFACE.ERROR]: { card: 's-error', heading: 's-error-t' },
  [VOICE_SURFACE.ARCHIVE]: { card: 's-lists', heading: 's-lists-t' },
  [VOICE_SURFACE.BOOKMARKS]: { card: 's-bookmarks', heading: 's-bookmarks-t' },
} as const satisfies Record<TVoiceSurface, { card: string; heading: string }>;

export const VOICE_CARDS_TEST_ID = 'voice-cards';

export const VOICE_SECTION_BAR_FADE_START_TEST_ID =
  'voice-section-bar-fade-start';

export const VOICE_SECTION_BAR_FADE_END_TEST_ID = 'voice-section-bar-fade-end';

export const VOICE_BAR_HEIGHT_PROPERTY = '--platform-voice-bar-height';
