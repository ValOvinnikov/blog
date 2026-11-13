import type { TValueOf } from '@blog/config/utils';

export const GRACE_EMAIL = {
  STARTED: 'STARTED',
  HALFWAY: 'HALFWAY',
  ENDING: 'ENDING',
} as const;

export type TGraceEmail = TValueOf<typeof GRACE_EMAIL>;

export const DOWNGRADE_GRACE_DAYS = 14;

export const GRACE_EMAIL_DAY: Record<TGraceEmail, number> = {
  [GRACE_EMAIL.STARTED]: 0,
  [GRACE_EMAIL.HALFWAY]: 7,
  [GRACE_EMAIL.ENDING]: 13,
};

export const GRACE_EMAIL_DUE_UNTIL_DAY: Record<TGraceEmail, number> = {
  [GRACE_EMAIL.STARTED]: GRACE_EMAIL_DAY[GRACE_EMAIL.HALFWAY],
  [GRACE_EMAIL.HALFWAY]: GRACE_EMAIL_DAY[GRACE_EMAIL.ENDING],
  [GRACE_EMAIL.ENDING]: DOWNGRADE_GRACE_DAYS,
};
