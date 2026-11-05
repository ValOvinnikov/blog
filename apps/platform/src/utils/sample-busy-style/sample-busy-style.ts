import type { IBusyStyle } from '@blog/config';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export const toSampleBusyStyle = ({
  busyButtonStyle,
  spinnerStyle,
}: Pick<TLookFormValues, 'busyButtonStyle' | 'spinnerStyle'>): IBusyStyle => ({
  busyStyle: busyButtonStyle,
  spinnerVariant: spinnerStyle,
});
