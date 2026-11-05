import { BUSY_BUTTON_STYLE, type TBusyButtonStyle } from '@blog/config';

export const hasBusySpinner = (busyButtonStyle: TBusyButtonStyle): boolean =>
  busyButtonStyle !== BUSY_BUTTON_STYLE.EDGE;
