import type { TValueOf } from '@blog/config/utils';

export const BRAND_VARIANTS = {
  CONSOLE: 'CONSOLE',
  INDIGO: 'INDIGO',
} as const;

export type TBrandVariants = TValueOf<typeof BRAND_VARIANTS>;
