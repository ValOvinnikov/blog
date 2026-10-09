'use client';

import { SegmentedControl } from '@platform/components/shared/segmented-control';
import type { TPreviewMode } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';

export type TPreviewModeControlProps = {
  value: TPreviewMode;
  onChange: (mode: TPreviewMode) => void;
};

export const PreviewModeControl = ({
  value,
  onChange,
}: TPreviewModeControlProps) => {
  const t = useTranslations('previewModeControl');

  return (
    <SegmentedControl
      ariaLabel={t('previewColorSchemeAriaLabel')}
      options={[
        { value: 'light', label: t('modeLight') },
        { value: 'dark', label: t('modeDark') },
      ]}
      value={value}
      onChange={onChange}
    />
  );
};
