'use client';

import type { TIconToggleGroupProps } from '@platform/components/shared/icon-toggle-group';
import { IconToolbar } from '@platform/components/shared/icon-toolbar';
import { usePreviewDeviceGroup } from '@platform/components/shared/preview-device-group';
import { usePreviewModeGroup } from '@platform/components/shared/preview-mode-group';
import type { TPreviewDevice } from '@platform/constants/preview';
import type { TPreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

export type TPreviewFrameToolbarProps = PropsWithChildren<{
  device: TPreviewDevice;
  onDeviceChange(device: TPreviewDevice): void;
  colorScheme: TPreviewColorScheme;
  extraGroups?: TIconToggleGroupProps<string>[];
  isEndOnOwnLine?: boolean;
}>;

export const PreviewFrameToolbar = ({
  device,
  onDeviceChange,
  colorScheme: { mode, modes, setMode },
  extraGroups = [],
  isEndOnOwnLine,
  children,
}: TPreviewFrameToolbarProps) => {
  const t = useTranslations('devicePreview');
  const deviceGroup = usePreviewDeviceGroup(device, onDeviceChange);
  const modeGroup = usePreviewModeGroup(mode, setMode, modes);

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
