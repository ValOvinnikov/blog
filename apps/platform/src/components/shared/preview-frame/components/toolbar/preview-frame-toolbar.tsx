'use client';

import { ICONS } from '@blog/config';
import type { TIconToggleGroupProps } from '@platform/components/shared/icon-toggle-group';
import { IconToolbar } from '@platform/components/shared/icon-toolbar';
import { usePreviewModeGroup } from '@platform/components/shared/preview-mode-group';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
  type TPreviewMode,
} from '@platform/constants/preview';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

export type TPreviewFrameToolbarProps = PropsWithChildren<{
  device: TPreviewDevice;
  onDeviceChange(device: TPreviewDevice): void;
  mode: TPreviewMode;
  onModeChange(mode: TPreviewMode): void;
  extraGroups?: TIconToggleGroupProps<string>[];
  isEndOnOwnLine?: boolean;
}>;

export const PreviewFrameToolbar = ({
  device,
  onDeviceChange,
  mode,
  onModeChange,
  extraGroups = [],
  isEndOnOwnLine,
  children,
}: TPreviewFrameToolbarProps) => {
  const t = useTranslations('devicePreview');
  const widthOf = (target: TPreviewDevice) => ({
    width: PREVIEW_DEVICE_WIDTH[target],
  });

  const deviceGroup: TIconToggleGroupProps<TPreviewDevice> = {
    ariaLabel: t('deviceGroupAriaLabel'),
    value: device,
    onChange: onDeviceChange,
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

  const modeGroup = usePreviewModeGroup(mode, onModeChange);

  return (
    <IconToolbar
      ariaLabel={t('toolbarAriaLabel')}
      groups={[deviceGroup, modeGroup, ...extraGroups]}
      isEndOnOwnLine={isEndOnOwnLine}
    >
      {children}
    </IconToolbar>
  );
};
