import type { TValueOf } from '@blog/config/utils';

export const SITE_TYPE = {
  BLOG: 'BLOG',
  PORTFOLIO: 'PORTFOLIO',
  PERSONAL: 'PERSONAL',
  DOCS: 'DOCS',
  BLANK: 'BLANK',
  BUSINESS: 'BUSINESS',
  PRODUCT: 'PRODUCT',
} as const;

export type TSiteType = TValueOf<typeof SITE_TYPE>;
