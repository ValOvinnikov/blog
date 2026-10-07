import { SPACING_SCALE, type TSpacingScale } from '@blog/config';

export const BAND_SPACING_TOP = {
  [SPACING_SCALE.NONE]: 'pt-0',
  [SPACING_SCALE.SM]: 'pt-[calc(var(--spacing-band-sm)*2/3)] sm:pt-band-sm',
  [SPACING_SCALE.MD]:
    'pt-[calc(var(--spacing-band-md)*2/3)] sm:pt-[calc(var(--spacing-band-md)*5/6)] lg:pt-band-md',
  [SPACING_SCALE.LG]:
    'pt-[calc(var(--spacing-band-lg)*5/8)] sm:pt-[calc(var(--spacing-band-lg)*13/16)] lg:pt-band-lg',
  [SPACING_SCALE.XL]:
    'pt-[calc(var(--spacing-band-xl)*7/12)] sm:pt-[calc(var(--spacing-band-xl)*3/4)] lg:pt-band-xl',
} as const satisfies Record<TSpacingScale, string>;

export const BAND_SPACING_BOTTOM = {
  [SPACING_SCALE.NONE]: 'pb-0',
  [SPACING_SCALE.SM]: 'pb-[calc(var(--spacing-band-sm)*2/3)] sm:pb-band-sm',
  [SPACING_SCALE.MD]:
    'pb-[calc(var(--spacing-band-md)*2/3)] sm:pb-[calc(var(--spacing-band-md)*5/6)] lg:pb-band-md',
  [SPACING_SCALE.LG]:
    'pb-[calc(var(--spacing-band-lg)*5/8)] sm:pb-[calc(var(--spacing-band-lg)*13/16)] lg:pb-band-lg',
  [SPACING_SCALE.XL]:
    'pb-[calc(var(--spacing-band-xl)*7/12)] sm:pb-[calc(var(--spacing-band-xl)*3/4)] lg:pb-band-xl',
} as const satisfies Record<TSpacingScale, string>;
