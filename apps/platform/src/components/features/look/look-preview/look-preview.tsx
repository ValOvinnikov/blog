'use client';

import type {
  TCardStyle,
  TDensity,
  TFontChoice,
  TRadiusScale,
} from '@blog/config';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { Card } from '@platform/components/shared/card';
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
};

/**
 * Light/dark is the preview's own toggle rather than tenant config, since a
 * reader's `prefers-color-scheme` picks the ramp on the live site.
 */
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

  const { actions, frame, note } = lookPreviewVariants({
    isMobile: width === 'mobile',
  });

  return (
    <Card>
      <Card.Header
        title={t('livePreviewHeading')}
        supportingText={t('livePreviewDescription')}
        headingLevel={2}
        actions={
          <div className={actions()}>
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
        }
      />
      <Card.Body>
        <div className={frame()}>
          <LookSample
            tenantName={tenantName}
            logoSrc={logoSrc}
            tokenStyle={tokenStyle}
            isDark={isDark}
            headingFontFamily={heading.fontFamily}
            bodyFontFamily={body.fontFamily}
          />
        </div>
        <p className={note()}>{t('previewNote')}</p>
      </Card.Body>
    </Card>
  );
};
