import type { TValueOf } from '@blog/config/utils';

export const BRAND_TAGLINE_SEPARATORS = {
  DOT: 'DOT',
  PIPE: 'PIPE',
  BULLET: 'BULLET',
  SLASH: 'SLASH',
} as const;

export type TBrandTaglineSeparator = TValueOf<typeof BRAND_TAGLINE_SEPARATORS>;

export const BRAND_TAGLINE_SEPARATOR_CHARS: Record<
  TBrandTaglineSeparator,
  string
> = {
  [BRAND_TAGLINE_SEPARATORS.DOT]: '·',
  [BRAND_TAGLINE_SEPARATORS.PIPE]: '|',
  [BRAND_TAGLINE_SEPARATORS.BULLET]: '•',
  [BRAND_TAGLINE_SEPARATORS.SLASH]: '/',
};
