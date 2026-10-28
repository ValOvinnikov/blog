import { type IBusyStyle, toSpinnerVariant } from '@blog/config';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export const toSampleBusyStyle = ({
  preset,
  busyButtonStyle,
  spinnerStyle,
}: Pick<
  TLookFormValues,
  'preset' | 'busyButtonStyle' | 'spinnerStyle'
>): IBusyStyle => ({
  busyStyle: busyButtonStyle,
  spinnerVariant: toSpinnerVariant(spinnerStyle, preset),
});
