import { CARD_STYLE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const cardStyleGlyphVariants = tv({
  slots: {
    card: [
      'relative flex h-7.5 w-12 shrink-0 flex-col justify-center gap-1.25 rounded-admin-control px-1.75',
    ],
    bar: ['absolute inset-y-1 left-0 hidden w-0.75 bg-admin-glyph-accent'],
    line: ['block h-0.75 rounded-full bg-admin-muted'],
    shortLine: ['block h-0.75 w-[62%] rounded-full bg-admin-glyph-line-soft'],
  },
  variants: {
    cardStyle: {
      [CARD_STYLE.ACCENT_BAR]: {
        card: ['border border-admin-control-line-locked bg-admin-surface'],
        bar: ['block'],
      },
      [CARD_STYLE.OUTLINED]: {
        card: ['border border-admin-control-line bg-admin-surface'],
      },
      [CARD_STYLE.FILLED]: { card: ['bg-admin-glyph-fill'] },
      [CARD_STYLE.RAISED]: {
        card: [
          'border border-admin-control-line-locked bg-admin-glyph-raised shadow-admin-glyph',
        ],
      },
      [CARD_STYLE.PLAIN]: {},
    },
  },
});
