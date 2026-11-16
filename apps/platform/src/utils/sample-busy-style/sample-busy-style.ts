import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { IBusyStyle } from '@shinefold/config';

export const toSampleBusyStyle = ({
  busyButtonStyle,
  spinnerStyle,
}: Pick<TLookFormValues, 'busyButtonStyle' | 'spinnerStyle'>): IBusyStyle => ({
  busyStyle: busyButtonStyle,
  spinnerVariant: spinnerStyle,
});
