import {
  BUSY_BUTTON_STYLE,
  type IBusyStyle,
  type TBusyButtonStyle,
} from '@blog/config';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export const toSampleBusyStyle = ({
  busyButtonStyle,
  spinnerStyle,
}: Pick<TLookFormValues, 'busyButtonStyle' | 'spinnerStyle'>): IBusyStyle => ({
  busyStyle: busyButtonStyle,
  spinnerVariant: spinnerStyle,
});

export const hasBusySpinner = (busyButtonStyle: TBusyButtonStyle): boolean =>
  busyButtonStyle !== BUSY_BUTTON_STYLE.EDGE;
