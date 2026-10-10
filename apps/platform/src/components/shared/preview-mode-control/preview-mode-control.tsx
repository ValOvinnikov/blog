'use client';

import { PREVIEW_MODE, type TPreviewMode } from '@blog/config';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
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
        { value: PREVIEW_MODE.LIGHT, label: t('modeLight') },
        { value: PREVIEW_MODE.DARK, label: t('modeDark') },
      ]}
      value={value}
      onChange={onChange}
    />
  );
};
