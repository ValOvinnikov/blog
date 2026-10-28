'use client';

import type { TLocaleIsoCode } from '@blog/config';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { PreviewModeControl } from '@platform/components/shared/preview-mode-control';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { PREVIEW_WIDTH, type TPreviewWidth } from '@platform/constants/preview';
import { toSampleBusyStyle } from '@platform/utils/sample-busy-style/sample-busy-style';
import { toSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import { buildSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type TLookPreviewProps = {
  liveLocales: readonly TLocaleIsoCode[];
  hasReaderAccounts: boolean;
};

export const LookPreview = ({
  liveLocales,
  hasReaderAccounts,
}: TLookPreviewProps) => {
  const { tenantName, values } = useLookForm();
  const t = useTranslations('lookPreview');
  const tPreview = useTranslations('previewModeControl');
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const [width, setWidth] = useState<TPreviewWidth>(PREVIEW_WIDTH.DESKTOP);
  const isNarrow = width === PREVIEW_WIDTH.MOBILE;

  const widthOptions: { value: TPreviewWidth; label: string }[] = [
    { value: PREVIEW_WIDTH.DESKTOP, label: t('widthDesktop') },
    { value: PREVIEW_WIDTH.MOBILE, label: t('widthMobile') },
  ];

  return (
    <PreviewFrame
      ariaLabel={tPreview('livePreviewHeading')}
      isNarrow={isNarrow}
      widthControl={
        // Below 27.5rem the stage leaves the frame no wider than its 390px mobile width.
        <SegmentedControl
          className="@max-[27.5rem]:hidden"
          ariaLabel={t('previewWidthAriaLabel')}
          options={widthOptions}
          value={width}
          onChange={setWidth}
        />
      }
      controls={<PreviewModeControl value={mode} onChange={setMode} />}
      notes={<p>{t('previewNote')}</p>}
    >
      <LookSample
        brand={{ name: tenantName, logoSrc: values.logo.url }}
        theme={buildSitePreviewTheme(values, isDark)}
        liveLocales={liveLocales}
        header={toSampleHeaderStyle(values)}
        busy={toSampleBusyStyle(values)}
        hasReaderAccounts={hasReaderAccounts}
        isNarrow={isNarrow}
      />
    </PreviewFrame>
  );
};
