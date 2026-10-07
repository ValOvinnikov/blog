'use client';

import type { TDensity, TFontChoice, TRadiusScale } from '@blog/config';
import { Card } from '@platform/components/shared/card';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { FONT_OPTIONS } from '@platform/config/fonts';
import {
  buildAccentPreviewTokens,
  buildLogoPreviewTokens,
  buildShapePreviewTokens,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';
import { type CSSProperties, useState } from 'react';

import { lookPreviewVariants } from './look-preview-variants';
import { PreviewSample } from './preview-sample';

type TPreviewMode = 'light' | 'dark';

export type TLookPreviewProps = {
  tenantName: string;
  primaryDomain: string;
  accentHue: number;
  logoHue: number | undefined;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  logoSrc: string | undefined;
};

/**
 * Light/dark is the preview's own toggle rather than tenant config, since a
 * reader's `prefers-color-scheme` picks the ramp on the live site.
 */
export const LookPreview = ({
  tenantName,
  primaryDomain,
  accentHue,
  logoHue,
  headingFont,
  bodyFont,
  radiusScale,
  density,
  logoSrc,
}: TLookPreviewProps) => {
  const t = useTranslations('lookPreview');
  const [mode, setMode] = useState<TPreviewMode>('light');
  const isDark = mode === 'dark';
  const resolvedLogoHue = logoHue ?? accentHue;

  const modeOptions: { value: TPreviewMode; label: string }[] = [
    { value: 'light', label: t('modeLight') },
    { value: 'dark', label: t('modeDark') },
  ];

  const tokenStyle = {
    ...buildAccentPreviewTokens(accentHue, isDark),
    ...buildLogoPreviewTokens(resolvedLogoHue, isDark),
    ...buildShapePreviewTokens(radiusScale, density),
  } as CSSProperties;

  const heading = FONT_OPTIONS[headingFont];
  const body = FONT_OPTIONS[bodyFont];

  const {
    root,
    note,
    deviceBar,
    deviceDots,
    deviceDot,
    deviceUrl,
    frame,
    framePlaceholder,
  } = lookPreviewVariants();

  return (
    <div className={root()}>
      <Card>
        <Card.Header
          title={t('livePreviewHeading')}
          supportingText={t('livePreviewDescription')}
          headingLevel={2}
          actions={
            <SegmentedControl
              ariaLabel={t('previewColorSchemeAriaLabel')}
              options={modeOptions}
              value={mode}
              onChange={setMode}
            />
          }
        />
        <Card.Body>
          <PreviewSample
            tenantName={tenantName}
            logoSrc={logoSrc}
            tokenStyle={tokenStyle}
            isDark={isDark}
            headingFontFamily={heading.fontFamily}
            bodyFontFamily={body.fontFamily}
          />
          <p className={note()}>{t('previewNote')}</p>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header
          title={t('fullPagePreviewHeading')}
          supportingText={t('fullPagePreviewDescription')}
          headingLevel={2}
        />
        <Card.Body>
          <div className={deviceBar()}>
            <span className={deviceDots()} aria-hidden="true">
              <span className={deviceDot()} />
              <span className={deviceDot()} />
              <span className={deviceDot()} />
            </span>
            <span className={deviceUrl()}>
              {t('deviceUrl', { primaryDomain })}
            </span>
          </div>
          <div className={frame()}>
            <p className={framePlaceholder()}>{t('framePlaceholder')}</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
