import { CARD_STYLE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const cardStyleGlyphVariants = tv({
  slots: {
    card: [
      'flex h-[30px] w-12 shrink-0 flex-col justify-center gap-[5px] rounded-admin-control px-[7px]',
    ],
    line: ['block h-[3px] rounded-full bg-admin-muted'],
    shortLine: ['block h-[3px] w-[62%] rounded-full bg-admin-faint'],
  },
  variants: {
    cardStyle: {
      [CARD_STYLE.ACCENT_BAR]: {
        card: [
          'border border-l-[3px] border-admin-control-line-locked border-l-admin-glyph-accent bg-admin-surface',
        ],
      },
      [CARD_STYLE.OUTLINED]: {
        card: ['border border-admin-control-line bg-admin-surface'],
      },
      [CARD_STYLE.FILLED]: { card: ['bg-admin-glyph-fill'] },
      [CARD_STYLE.RAISED]: {
        card: [
          'border border-admin-control-line-locked bg-admin-surface shadow-admin-glyph',
        ],
      },
      [CARD_STYLE.PLAIN]: {},
    },
  },
});
