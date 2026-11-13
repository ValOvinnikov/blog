import { CARD_STYLE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const cardStyleGlyphVariants = tv({
  slots: {
    card: [
      'relative flex h-7.5 w-12 shrink-0 flex-col justify-center gap-1.25 rounded-platform-control px-1.75',
    ],
    bar: ['absolute inset-y-1 left-0 hidden w-0.75 bg-platform-glyph-accent'],
    line: ['block h-0.75 rounded-full bg-platform-muted'],
    shortLine: [
      'block h-0.75 w-[62%] rounded-full bg-platform-glyph-line-soft',
    ],
  },
  variants: {
    cardStyle: {
      [CARD_STYLE.ACCENT_BAR]: {
        card: [
          'border border-platform-control-line-locked bg-platform-surface',
        ],
        bar: ['block'],
      },
      [CARD_STYLE.OUTLINED]: {
        card: ['border border-platform-control-line bg-platform-surface'],
      },
      [CARD_STYLE.FILLED]: { card: ['bg-platform-glyph-fill'] },
      [CARD_STYLE.RAISED]: {
        card: [
          'border border-platform-control-line-locked bg-platform-glyph-raised shadow-platform-glyph',
        ],
      },
      [CARD_STYLE.PLAIN]: {},
    },
  },
});
