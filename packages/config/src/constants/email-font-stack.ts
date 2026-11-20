import { FONT_CHOICE, type TFontChoice } from './preset';

// Single quotes only: email builders embed a stack in a double-quoted style attribute.
const SERIF_FALLBACK = 'Georgia, serif';
const SANS_FALLBACK = 'Arial, Helvetica, sans-serif';
const MONO_FALLBACK = "'Courier New', monospace";

export const EMAIL_FONT_STACK: Record<TFontChoice, string> = {
  [FONT_CHOICE.SPACE_GROTESK]: `'Space Grotesk', ${SANS_FALLBACK}`,
  [FONT_CHOICE.NEWSREADER]: `Newsreader, ${SERIF_FALLBACK}`,
  [FONT_CHOICE.JETBRAINS_MONO]: `'JetBrains Mono', ${MONO_FALLBACK}`,
  [FONT_CHOICE.FRAUNCES]: `Fraunces, ${SERIF_FALLBACK}`,
  [FONT_CHOICE.INTER]: `Inter, ${SANS_FALLBACK}`,
};
