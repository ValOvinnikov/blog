import type { TValueOf } from '@blog/config/utils';

export const HEADER_LAYOUT = {
  CLASSIC: 'CLASSIC',
  LINKS_BESIDE_BRAND: 'LINKS_BESIDE_BRAND',
  CENTRED_LINKS: 'CENTRED_LINKS',
  TWO_ROWS: 'TWO_ROWS',
  CENTRED_BRAND: 'CENTRED_BRAND',
  MENU_BUTTON: 'MENU_BUTTON',
} as const;

export type THeaderLayout = TValueOf<typeof HEADER_LAYOUT>;

export const HEADER_SUBMENU_STYLE = {
  DROPDOWN: 'DROPDOWN',
  WIDE_PANEL: 'WIDE_PANEL',
} as const;

export type THeaderSubmenuStyle = TValueOf<typeof HEADER_SUBMENU_STYLE>;

export const HEADER_BAR_STYLE = {
  FULL_WIDTH: 'FULL_WIDTH',
  FLOATING: 'FLOATING',
} as const;

export type THeaderBarStyle = TValueOf<typeof HEADER_BAR_STYLE>;
