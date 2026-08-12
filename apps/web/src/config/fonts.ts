import { FONT_CHOICE, type TFontChoice } from '@blog/config';
import {
  Fraunces,
  Inter,
  JetBrains_Mono,
  Newsreader,
  Space_Grotesk,
} from 'next/font/google';

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-display-family',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display-family',
});

export const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-body-family',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body-family',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-family',
});

const HEADING_FONTS: Partial<Record<TFontChoice, { variable: string }>> = {
  [FONT_CHOICE.SPACE_GROTESK]: spaceGrotesk,
  [FONT_CHOICE.FRAUNCES]: fraunces,
};

const BODY_FONTS: Partial<Record<TFontChoice, { variable: string }>> = {
  [FONT_CHOICE.NEWSREADER]: newsreader,
  [FONT_CHOICE.INTER]: inter,
};

/**
 * Resolves the `next/font` CSS variable classes to apply to `<html>` for the
 * given theme tokens' `headingFont`/`bodyFont` — each candidate font shares
 * its role's fixed variable name (`--font-display-family`/
 * `--font-body-family`), so only the selected one's class needs applying.
 * `jetbrainsMono` has no per-preset selection (no theme token names a
 * dedicated UI font) and is always included, backing `--font-ui`. Falls back
 * to the Console picks for any `TFontChoice` not mapped to its role (e.g. a
 * mono choice picked for `headingFont`).
 *
 * @example
 * resolveFontVariableClassName('FRAUNCES', 'INTER') // '--font-display-family --font-body-family --font-mono-family' classes
 */
export function resolveFontVariableClassName(
  headingFont: TFontChoice,
  bodyFont: TFontChoice,
): string {
  const heading = HEADING_FONTS[headingFont] ?? spaceGrotesk;
  const body = BODY_FONTS[bodyFont] ?? newsreader;

  return `${heading.variable} ${body.variable} ${jetbrainsMono.variable}`;
}
