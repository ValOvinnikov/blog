import type { TValueOf } from '@blog/config/utils';

export const FOOTER_FINE_PRINT_KIND = {
  LINK: 'LINK',
  COOKIE_SETTINGS: 'COOKIE_SETTINGS',
} as const;

export type TFooterFinePrintKind = TValueOf<typeof FOOTER_FINE_PRINT_KIND>;
