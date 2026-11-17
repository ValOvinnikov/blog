import type { TIconToggleGroupProps } from '@platform/components/shared/icon-toggle-group';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { ICONS } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export const usePreviewDeviceGroup = (
  value: TPreviewDevice,
  onChange: (device: TPreviewDevice) => void,
): TIconToggleGroupProps<TPreviewDevice> => {
  const t = useTranslations('devicePreview');
  const widthOf = (target: TPreviewDevice) => ({
    width: PREVIEW_DEVICE_WIDTH[target],
  });

  return {
    ariaLabel: t('deviceGroupAriaLabel'),
    value,
    onChange,
    options: [
      {
        value: PREVIEW_DEVICE.DESKTOP,
        icon: ICONS.MONITOR,
        ariaLabel: t('deviceDesktop'),
        tooltip: t('tooltipDesktop', widthOf(PREVIEW_DEVICE.DESKTOP)),
      },
      {
        value: PREVIEW_DEVICE.TABLET,
        icon: ICONS.TABLET,
        ariaLabel: t('deviceTablet'),
        tooltip: t('tooltipTablet', widthOf(PREVIEW_DEVICE.TABLET)),
      },
      {
        value: PREVIEW_DEVICE.PHONE,
        icon: ICONS.PHONE,
        ariaLabel: t('devicePhone'),
        tooltip: t('tooltipPhone', widthOf(PREVIEW_DEVICE.PHONE)),
      },
    ],
  };
};
