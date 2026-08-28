import { FONT_CHOICE, type TFontChoice } from '@blog/config';

import { fraunces } from './font-loaders/fraunces-font';
import { inter } from './font-loaders/inter-font';
import { jetbrainsMono } from './font-loaders/jetbrains-mono-font';
import { newsreader } from './font-loaders/newsreader-font';
import { spaceGrotesk } from './font-loaders/space-grotesk-font';

export type TFontOption = {
  value: TFontChoice;
  label: string;
  fontFamily: string;
};

/**
 * The closed set of five selectable fonts — `next/font` loaders must be
 * static and module-scoped, so this list can't grow without a code change
 * and a deploy. Each entry's `fontFamily` is the real, already-loaded
 * webfont's resolved CSS value, so a picker or preview applying it via
 * inline style renders the font itself, not a system-font approximation.
 */
export const FONT_OPTIONS: Record<TFontChoice, TFontOption> = {
  [FONT_CHOICE.SPACE_GROTESK]: {
    value: FONT_CHOICE.SPACE_GROTESK,
    label: 'Space Grotesk',
    fontFamily: spaceGrotesk.style.fontFamily,
  },
  [FONT_CHOICE.NEWSREADER]: {
    value: FONT_CHOICE.NEWSREADER,
    label: 'Newsreader',
    fontFamily: newsreader.style.fontFamily,
  },
  [FONT_CHOICE.JETBRAINS_MONO]: {
    value: FONT_CHOICE.JETBRAINS_MONO,
    label: 'JetBrains Mono',
    fontFamily: jetbrainsMono.style.fontFamily,
  },
  [FONT_CHOICE.FRAUNCES]: {
    value: FONT_CHOICE.FRAUNCES,
    label: 'Fraunces',
    fontFamily: fraunces.style.fontFamily,
  },
  [FONT_CHOICE.INTER]: {
    value: FONT_CHOICE.INTER,
    label: 'Inter',
    fontFamily: inter.style.fontFamily,
  },
};
