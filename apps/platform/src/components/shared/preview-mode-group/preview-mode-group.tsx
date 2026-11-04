'use client';

import { IconToggleGroup } from '@platform/components/shared/icon-toggle-group';
import { Tooltip } from '@platform/components/shared/tooltip';
import type { TPreviewMode } from '@platform/constants/preview';

import { usePreviewModeGroup } from './use-preview-mode-group';

export type TPreviewModeGroupProps = {
  value: TPreviewMode;
  onChange: (mode: TPreviewMode) => void;
};

export const PreviewModeGroup = ({
  value,
  onChange,
}: TPreviewModeGroupProps) => (
  <Tooltip.Provider>
    <IconToggleGroup {...usePreviewModeGroup(value, onChange)} />
  </Tooltip.Provider>
);
