import type { TValueOf } from '@blog/config/utils';

export const CTA_VARIANT = {
  BANNER: 'BANNER',
  SPLIT: 'SPLIT',
  CALLOUT: 'CALLOUT',
} as const;

export type TCtaVariant = TValueOf<typeof CTA_VARIANT>;

export const CTA_ALIGNMENT = {
  LEFT: 'LEFT',
  CENTER: 'CENTER',
  RIGHT: 'RIGHT',
} as const;

export type TCtaAlignment = TValueOf<typeof CTA_ALIGNMENT>;

export const CTA_MOBILE_MEDIA_ORDER = {
  LAST: 'LAST',
  FIRST: 'FIRST',
} as const;

export type TCtaMobileMediaOrder = TValueOf<typeof CTA_MOBILE_MEDIA_ORDER>;

export const CTA_ACTION_APPEARANCE = {
  CONTAINED: 'CONTAINED',
  INLINE: 'INLINE',
} as const;

export type TCtaActionAppearance = TValueOf<typeof CTA_ACTION_APPEARANCE>;

export const CTA_ACTION_VARIANT = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
} as const;

export type TCtaActionVariant = TValueOf<typeof CTA_ACTION_VARIANT>;
