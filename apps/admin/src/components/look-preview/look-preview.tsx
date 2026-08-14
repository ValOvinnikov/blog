'use client';

import { FONT_OPTIONS } from '@admin/config/fonts';
import {
  buildAccentPreviewTokens,
  buildLogoPreviewTokens,
} from '@admin/utils/theme-preview-tokens/theme-preview-tokens';
import { Size, type TFontChoice } from '@blog/config';
import { BrandMark } from '@blog/ui/atoms/brand-mark';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';
import { Text } from '@blog/ui/atoms/text';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import { useTranslations } from 'next-intl';
import { type CSSProperties, useState } from 'react';

import { lookPreviewVariants } from './look-preview-variants';

type TPreviewMode = 'light' | 'dark';

export type TLookPreviewProps = {
  tenantSlug: string;
  accentHue: number;
  logoHue: number | undefined;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  chromeOn: boolean;
};

/**
 * Tier 1 (inline, this component) and tier 2 (the reserved full-page panel
 * below it) of the Look tab's live preview. Light/dark is this preview's own
 * toggle, not tenant config — a reader's `prefers-color-scheme` choice,
 * independent of whichever preset is selected, so both ramps must be
 * previewable regardless of preset.
 */
export function LookPreview({
  tenantSlug,
  accentHue,
  logoHue,
  headingFont,
  bodyFont,
  chromeOn,
}: TLookPreviewProps) {
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
    card,
    cardHead,
    cardHeadText,
    cardBody,
    previewBox,
    previewSurface,
    brandRow,
    brandName,
    sampleHeading,
    samplePara,
    actionsRow,
    chip,
    note,
    deviceBar,
    deviceDots,
    deviceDot,
    deviceUrl,
    frame,
    framePlaceholder,
  } = lookPreviewVariants({ isDark });

  const sample = (
    <>
      <div className={brandRow()}>
        <BrandMark size={Size.SM} title={tenantSlug} />
        <span
          className={brandName()}
          style={{ fontFamily: heading.fontFamily }}
        >
          {tenantSlug}
        </span>
      </div>
      <Heading
        level={3}
        className={sampleHeading()}
        style={{ fontFamily: heading.fontFamily }}
      >
        {t('sampleHeading')}
      </Heading>
      <Text className={samplePara()} style={{ fontFamily: body.fontFamily }}>
        {t('samplePara')}
      </Text>
      <div className={actionsRow()}>
        <Button type="button" size={Size.SM}>
          {t('subscribeButton')}
        </Button>
        <Button type="button" variant="ghost" size={Size.SM}>
          {t('readMoreButton')}
        </Button>
        <span className={chip()}>{t('readTimeChip')}</span>
      </div>
    </>
  );

  return (
    <div className={root()}>
      <section className={card()}>
        <header className={cardHead()}>
          <div className={cardHeadText()}>
            <Heading level={2} size={Size.XS}>
              {t('livePreviewHeading')}
            </Heading>
            <Text variant="muted">{t('livePreviewDescription')}</Text>
          </div>
          <SegmentedControl
            ariaLabel={t('previewColorSchemeAriaLabel')}
            options={modeOptions}
            value={mode}
            onChange={setMode}
          />
        </header>
        <div className={cardBody()} style={tokenStyle}>
          {chromeOn ? (
            <WindowChrome className={previewSurface()}>
              <WindowChrome.Bar>
                <WindowChrome.Prompt>{t('terminalPrompt')}</WindowChrome.Prompt>
              </WindowChrome.Bar>
              <WindowChrome.Body>{sample}</WindowChrome.Body>
            </WindowChrome>
          ) : (
            <div className={previewBox()}>{sample}</div>
          )}
          <p className={note()}>{t('previewNote')}</p>
        </div>
      </section>

      <section className={card()}>
        <header className={cardHead()}>
          <div className={cardHeadText()}>
            <Heading level={2} size={Size.XS}>
              {t('fullPagePreviewHeading')}
            </Heading>
            <Text variant="muted">{t('fullPagePreviewDescription')}</Text>
          </div>
        </header>
        <div className={cardBody()}>
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
        </div>
      </section>
    </div>
  );
}
