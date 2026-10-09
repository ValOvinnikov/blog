'use client';

import type {
  TCardStyle,
  TDensity,
  TFontChoice,
  TLanguageSwitcherStyle,
  TLocaleIsoCode,
  TRadiusScale,
} from '@blog/config';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { buildThemePreviewStyle } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { lookPreviewVariants } from './look-preview-variants';

type TPreviewMode = 'light' | 'dark';

type TPreviewWidth = 'desktop' | 'mobile';

export type TLookPreviewProps = {
  tenantName: string;
  accentHue: number;
  logoHue: number | undefined;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  cardStyle: TCardStyle;
  logoSrc: string | undefined;
  liveLocales: readonly TLocaleIsoCode[];
  languageSwitcherStyle: TLanguageSwitcherStyle;
};

export const LookPreview = ({
  tenantName,
  accentHue,
  logoHue,
  headingFont,
  bodyFont,
  radiusScale,
  density,
  cardStyle,
  logoSrc,
  liveLocales,
  languageSwitcherStyle,
}: TLookPreviewProps) => {
  const t = useTranslations('lookPreview');
  const [mode, setMode] = useState<TPreviewMode>('light');
  const [width, setWidth] = useState<TPreviewWidth>('desktop');
  const isDark = mode === 'dark';

  const modeOptions: { value: TPreviewMode; label: string }[] = [
    { value: 'light', label: t('modeLight') },
    { value: 'dark', label: t('modeDark') },
  ];

  const widthOptions: { value: TPreviewWidth; label: string }[] = [
    { value: 'desktop', label: t('widthDesktop') },
    { value: 'mobile', label: t('widthMobile') },
  ];

  const tokenStyle = buildThemePreviewStyle(
    { accentHue, logoHue, radiusScale, density, cardStyle },
    isDark,
  );

  const heading = FONT_OPTIONS[headingFont];
  const body = FONT_OPTIONS[bodyFont];

  const { root, toolbar, stage, frame, note } = lookPreviewVariants({
    isMobile: width === 'mobile',
  });

  return (
    <section aria-label={t('livePreviewHeading')} className={root()}>
      <div className={toolbar()}>
        <SegmentedControl
          ariaLabel={t('previewWidthAriaLabel')}
          options={widthOptions}
          value={width}
          onChange={setWidth}
        />
        <SegmentedControl
          ariaLabel={t('previewColorSchemeAriaLabel')}
          options={modeOptions}
          value={mode}
          onChange={setMode}
        />
      </div>
      <div className={stage()}>
        <div className={frame()}>
          <LookSample
            tenantName={tenantName}
            logoSrc={logoSrc}
            tokenStyle={tokenStyle}
            isDark={isDark}
            headingFontFamily={heading.fontFamily}
            bodyFontFamily={body.fontFamily}
            liveLocales={liveLocales}
            languageSwitcherStyle={languageSwitcherStyle}
          />
        </div>
      </div>
      <p className={note()}>{t('previewNote')}</p>
    </section>
  );
};
