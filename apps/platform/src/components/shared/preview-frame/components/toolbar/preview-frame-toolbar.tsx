'use client';

import type { TIconToggleGroupProps } from '@platform/components/shared/icon-toggle-group';
import { IconToolbar } from '@platform/components/shared/icon-toolbar';
import { usePreviewDeviceGroup } from '@platform/components/shared/preview-device-group';
import { usePreviewModeGroup } from '@platform/components/shared/preview-mode-group';
import type { TPreviewDevice, TPreviewMode } from '@platform/constants/preview';
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
  const deviceGroup = usePreviewDeviceGroup(device, onDeviceChange);
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
