'use client';

import { Card } from '@admin/components/shared/card';
import { SegmentedControl } from '@admin/components/shared/segmented-control';
import { FONT_OPTIONS } from '@admin/config/fonts';
import {
  buildAccentPreviewTokens,
  buildLogoPreviewTokens,
} from '@admin/utils/theme-preview-tokens/theme-preview-tokens';
import type { TFontChoice } from '@blog/config';
import { useTranslations } from 'next-intl';
import { type CSSProperties, useState } from 'react';

import { lookPreviewVariants } from './look-preview-variants';
import { PreviewSample } from './preview-sample';

type TPreviewMode = 'light' | 'dark';

export type TLookPreviewProps = {
  tenantSlug: string;
  accentHue: number;
  logoHue: number | undefined;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  isChromeOn: boolean;
};

/**
 * Tier 1 (inline, this component) and tier 2 (the reserved full-page panel
 * below it) of the Look tab's live preview. The panel chrome here (the
 * cards, headers, mode toggle, and reserved full-page panel) is admin's own
 * design system — but `PreviewSample` inside it renders the *tenant's* site
 * theme through real site primitives and site tokens, since it must
 * show what the site will actually look like, not an admin-styled
 * approximation. Light/dark is this preview's own toggle, not tenant
 * config — a reader's `prefers-color-scheme` choice, independent of
 * whichever preset is selected, so both ramps must be previewable
 * regardless of preset.
 */
export const LookPreview = ({
  tenantSlug,
  accentHue,
  logoHue,
  headingFont,
  bodyFont,
  isChromeOn,
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
          description={t('livePreviewDescription')}
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
            tenantSlug={tenantSlug}
            tokenStyle={tokenStyle}
            isDark={isDark}
            headingFontFamily={heading.fontFamily}
            bodyFontFamily={body.fontFamily}
            isChromeOn={isChromeOn}
          />
          <p className={note()}>{t('previewNote')}</p>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header
          title={t('fullPagePreviewHeading')}
          description={t('fullPagePreviewDescription')}
        />
        <Card.Body>
          <div className={deviceBar()}>
            <span className={deviceDots()} aria-hidden="true">
              <span className={deviceDot()} />
              <span className={deviceDot()} />
              <span className={deviceDot()} />
            </span>
            <span className={deviceUrl()}>
              {t('deviceUrl', { tenantSlug })}
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
