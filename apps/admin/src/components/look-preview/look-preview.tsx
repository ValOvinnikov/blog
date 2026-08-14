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
import { type CSSProperties, useState } from 'react';

import { lookPreviewVariants } from './look-preview-variants';

type TPreviewMode = 'light' | 'dark';

const MODE_OPTIONS: { value: TPreviewMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

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
  const [mode, setMode] = useState<TPreviewMode>('light');
  const isDark = mode === 'dark';
  const resolvedLogoHue = logoHue ?? accentHue;

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
  } = lookPreviewVariants();

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
        Reading the tide charts
      </Heading>
      <Text className={samplePara()} style={{ fontFamily: body.fontFamily }}>
        A short dispatch to show heading and body type, accent, logo tones, and
        radius together.
      </Text>
      <div className={actionsRow()}>
        <Button type="button" size={Size.SM}>
          Subscribe
        </Button>
        <Button type="button" variant="ghost" size={Size.SM}>
          Read more
        </Button>
        <span className={chip()}>4 min read</span>
      </div>
    </>
  );

  return (
    <div className={root()}>
      <section className={card()}>
        <header className={cardHead()}>
          <div className={cardHeadText()}>
            <Heading level={2}>Live preview</Heading>
            <Text variant="muted">Real @blog/ui primitives</Text>
          </div>
          <SegmentedControl
            ariaLabel="Preview color scheme"
            options={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
          />
        </header>
        <div className={cardBody()} style={tokenStyle}>
          {chromeOn ? (
            <WindowChrome>
              <WindowChrome.Bar>
                <WindowChrome.Prompt>~$ ./publish</WindowChrome.Prompt>
              </WindowChrome.Bar>
              <WindowChrome.Body>{sample}</WindowChrome.Body>
            </WindowChrome>
          ) : (
            <div className={previewBox()}>{sample}</div>
          )}
          <p className={note()}>
            Unsaved form state → CSS custom properties, matching
            production&apos;s OKLCH ramp. Nothing here is live until you save.
          </p>
        </div>
      </section>

      <section className={card()}>
        <header className={cardHead()}>
          <div className={cardHeadText()}>
            <Heading level={2}>Full-page preview</Heading>
            <Text variant="muted">Reserved — needs a save to reflect</Text>
          </div>
        </header>
        <div className={cardBody()}>
          <div className={deviceBar()}>
            <span className={deviceDots()} aria-hidden="true">
              <span className={deviceDot()} />
              <span className={deviceDot()} />
              <span className={deviceDot()} />
            </span>
            <span className={deviceUrl()}>preview.{tenantSlug}.dev</span>
          </div>
          <div className={frame()}>
            <p className={framePlaceholder()}>
              Iframe of the real site in preview mode. Needs a save (or a
              preview-mode URL) to reflect — space and routing reserved now.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
