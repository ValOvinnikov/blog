import type { TValueOf } from '@blog/config/utils';

export const ACCOUNT_BUTTON_STYLE = {
  PILL: 'PILL',
  CIRCLE: 'CIRCLE',
} as const;

export type TAccountButtonStyle = TValueOf<typeof ACCOUNT_BUTTON_STYLE>;

export const ACCOUNT_PANEL_STYLE = {
  CARD: 'CARD',
  PROFILE: 'PROFILE',
  HUB: 'HUB',
} as const;

export type TAccountPanelStyle = TValueOf<typeof ACCOUNT_PANEL_STYLE>;

export const ACCOUNT_PHONE_PLACEMENT = {
  BAR: 'BAR',
  MENU: 'MENU',
} as const;

export type TAccountPhonePlacement = TValueOf<typeof ACCOUNT_PHONE_PLACEMENT>;

export interface IAccountControl {
  buttonStyle: TAccountButtonStyle;
  panelStyle: TAccountPanelStyle;
  phonePlacement: TAccountPhonePlacement;
}
