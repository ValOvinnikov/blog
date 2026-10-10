'use client';

import {
  PREVIEW_WIDTH,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
  type TPreviewWidth,
} from '@blog/config';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { PreviewModeControl } from '@platform/components/shared/preview-mode-control';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import {
  buildSitePreviewTheme,
  type TSitePreviewThemeValues,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type TLookPreviewProps = {
  tenantName: string;
  theme: TSitePreviewThemeValues;
  logoSrc: string | undefined;
  liveLocales: readonly TLocaleIsoCode[];
  languageSwitcherStyle: TLanguageSwitcherStyle;
};

export const LookPreview = ({
  tenantName,
  theme,
  logoSrc,
  liveLocales,
  languageSwitcherStyle,
}: TLookPreviewProps) => {
  const t = useTranslations('lookPreview');
  const tPreview = useTranslations('previewModeControl');
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const [width, setWidth] = useState<TPreviewWidth>(PREVIEW_WIDTH.DESKTOP);

  const widthOptions: { value: TPreviewWidth; label: string }[] = [
    { value: PREVIEW_WIDTH.DESKTOP, label: t('widthDesktop') },
    { value: PREVIEW_WIDTH.MOBILE, label: t('widthMobile') },
  ];

  return (
    <PreviewFrame
      ariaLabel={tPreview('livePreviewHeading')}
      isNarrow={width === PREVIEW_WIDTH.MOBILE}
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
        tenantName={tenantName}
        logoSrc={logoSrc}
        theme={buildSitePreviewTheme(theme, isDark)}
        liveLocales={liveLocales}
        languageSwitcherStyle={languageSwitcherStyle}
      />
    </PreviewFrame>
  );
};
