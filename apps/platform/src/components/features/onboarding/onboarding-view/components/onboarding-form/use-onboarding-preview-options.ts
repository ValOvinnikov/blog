import type { TMaybeUndefined } from '@blog/config';
import {
  PREVIEW_DEVICE,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useState } from 'react';

export type TOnboardingPreviewOptions = ReturnType<
  typeof useOnboardingPreviewOptions
>;

export const useOnboardingPreviewOptions = (isPhone: boolean) => {
  const [pressedDevice, setDevice] =
    useState<TMaybeUndefined<TPreviewDevice>>();
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const arrivalDevice = isPhone ? PREVIEW_DEVICE.PHONE : PREVIEW_DEVICE.DESKTOP;

  return {
    device: pressedDevice ?? arrivalDevice,
    setDevice,
    mode,
    setMode,
    isDark,
  };
};
