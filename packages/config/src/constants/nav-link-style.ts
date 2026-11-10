import type { TValueOf } from '@blog/config/utils';

export const NAV_LINK_STYLE = {
  PLAIN: 'PLAIN',
  UNDERLINE: 'UNDERLINE',
  SOFT: 'SOFT',
  PILL: 'PILL',
} as const;

export type TNavLinkStyle = TValueOf<typeof NAV_LINK_STYLE>;
