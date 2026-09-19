import { FONT_CHOICE, type TFontChoice } from '@blog/config';

import { fraunces } from './font-loaders/fraunces-font';
import { inter } from './font-loaders/inter-font';
import { jetbrainsMono } from './font-loaders/jetbrains-mono-font';
import { newsreader } from './font-loaders/newsreader-font';
import { spaceGrotesk } from './font-loaders/space-grotesk-font';

type TFontModule = { variable: string };

const HEADING_FONTS: Partial<Record<TFontChoice, TFontModule>> = {
  [FONT_CHOICE.SPACE_GROTESK]: spaceGrotesk,
  [FONT_CHOICE.FRAUNCES]: fraunces,
};

const BODY_FONTS: Partial<Record<TFontChoice, TFontModule>> = {
  [FONT_CHOICE.NEWSREADER]: newsreader,
  [FONT_CHOICE.INTER]: inter,
};

export const resolveFontVariableClassName = (
  headingFont: TFontChoice,
  bodyFont: TFontChoice,
): string => {
  const heading = HEADING_FONTS[headingFont] ?? spaceGrotesk;
  const body = BODY_FONTS[bodyFont] ?? newsreader;

  return `${heading.variable} ${body.variable} ${jetbrainsMono.variable}`;
};
