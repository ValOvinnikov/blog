import type { TValueOf } from '@blog/config/utils';

export const BUSY_BUTTON_STYLE = {
  LABEL: 'LABEL',
  KEPT: 'KEPT',
  EDGE: 'EDGE',
} as const;

export type TBusyButtonStyle = TValueOf<typeof BUSY_BUTTON_STYLE>;

export const SPINNER_STYLE = {
  PRESET: 'PRESET',
  BRAILLE: 'BRAILLE',
  RING: 'RING',
  DOTS: 'DOTS',
  PULSE: 'PULSE',
} as const;

export type TSpinnerStyle = TValueOf<typeof SPINNER_STYLE>;

export type TSpinnerVariant = Exclude<
  TSpinnerStyle,
  typeof SPINNER_STYLE.PRESET
>;

export interface IBusyStyle {
  busyStyle: TBusyButtonStyle;
  spinnerVariant: TSpinnerVariant;
}
