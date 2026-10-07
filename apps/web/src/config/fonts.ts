import { FONT_CHOICE, type TFontChoice } from '@blog/config';

import { frauncesBody } from './font-loaders/fraunces-body-font';
import { fraunces } from './font-loaders/fraunces-font';
import { inter } from './font-loaders/inter-font';
import { interHeading } from './font-loaders/inter-heading-font';
import { jetbrainsMonoBody } from './font-loaders/jetbrains-mono-body-font';
import { jetbrainsMono } from './font-loaders/jetbrains-mono-font';
import { jetbrainsMonoHeading } from './font-loaders/jetbrains-mono-heading-font';
import { newsreader } from './font-loaders/newsreader-font';
import { newsreaderHeading } from './font-loaders/newsreader-heading-font';
import { spaceGroteskBody } from './font-loaders/space-grotesk-body-font';
import { spaceGrotesk } from './font-loaders/space-grotesk-font';

type TFontModule = { variable: string };

const HEADING_FONTS: Record<TFontChoice, TFontModule> = {
  [FONT_CHOICE.SPACE_GROTESK]: spaceGrotesk,
  [FONT_CHOICE.NEWSREADER]: newsreaderHeading,
  [FONT_CHOICE.JETBRAINS_MONO]: jetbrainsMonoHeading,
  [FONT_CHOICE.FRAUNCES]: fraunces,
  [FONT_CHOICE.INTER]: interHeading,
};

const BODY_FONTS: Record<TFontChoice, TFontModule> = {
  [FONT_CHOICE.SPACE_GROTESK]: spaceGroteskBody,
  [FONT_CHOICE.NEWSREADER]: newsreader,
  [FONT_CHOICE.JETBRAINS_MONO]: jetbrainsMonoBody,
  [FONT_CHOICE.FRAUNCES]: frauncesBody,
  [FONT_CHOICE.INTER]: inter,
};

export const resolveFontVariableClassName = (
  headingFont: TFontChoice,
  bodyFont: TFontChoice,
): string => {
  return `${HEADING_FONTS[headingFont].variable} ${BODY_FONTS[bodyFont].variable} ${jetbrainsMono.variable}`;
};
