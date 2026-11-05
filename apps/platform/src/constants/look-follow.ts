import type { TValueOf } from '@blog/config/utils';

export const LOOK_FOLLOW_TARGET = {
  IDLE: 'IDLE',
  ALL_OPEN: 'ALL_OPEN',
  STYLE: 'STYLE',
  PART: 'PART',
} as const;

export const LOOK_FOLLOW_OUTCOME = {
  IN_VIEW: 'IN_VIEW',
  FITS: 'FITS',
  AT_TOP: 'AT_TOP',
  AT_END: 'AT_END',
  NEARLY_FITS: 'NEARLY_FITS',
} as const;

export type TLookFollowOutcome = TValueOf<typeof LOOK_FOLLOW_OUTCOME>;

export const LOOK_FOLLOW_MARK = {
  OUTLINE_WIDTH: 2,
  TAG_FONT_SIZE: 11,
  TAG_HEIGHT: 20,
  TAG_PADDING_X: 7,
  TAG_RADIUS: 3,
} as const;

export const LOOK_FOLLOW_LIMIT = {
  OVERFLOW_STEP: 10,
  NEARLY_FITS_SCREENS: 2,
  SCROLL_TOLERANCE: 1,
  SETTLE_STILL_FRAMES: 3,
  SETTLE_TIMEOUT_MS: 1500,
} as const;

export const LOOK_FOLLOW_TEST_ID = {
  OUTLINE: 'look-follow-outline',
} as const;
