import {
  IMAGE_PROPORTION,
  type TImageProportion,
} from '@shinefold/config/constants';

import type { TThemeDeclarations } from './theme-declarations';

const WIDE = '16 / 9';
const CLASSIC = '4 / 3';

const both = (ratio: string): TThemeDeclarations => ({
  '--aspect-card': ratio,
  '--aspect-split': ratio,
});

export const IMAGE_PROPORTION_DECLARATIONS: Record<
  TImageProportion,
  TThemeDeclarations
> = {
  [IMAGE_PROPORTION.AS_DESIGNED]: {
    '--aspect-card': WIDE,
    '--aspect-split': CLASSIC,
  },
  [IMAGE_PROPORTION.WIDE]: both(WIDE),
  [IMAGE_PROPORTION.CLASSIC]: both(CLASSIC),
  [IMAGE_PROPORTION.SQUARE]: both('1 / 1'),
};
