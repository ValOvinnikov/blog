import { useId } from 'react';

import type { TCheckedField } from './look-save-checks';

export const useCheckedFieldIds = (): Record<TCheckedField, string> => ({
  accentHue: useId(),
  buttonColor: useId(),
  buttonColorDark: useId(),
  brandName: useId(),
});
