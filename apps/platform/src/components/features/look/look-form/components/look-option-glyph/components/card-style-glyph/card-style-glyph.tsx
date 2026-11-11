import type { TCardStyle } from '@blog/config';

import { cardStyleGlyphVariants } from './card-style-glyph-variants';

export type TCardStyleGlyphProps = {
  cardStyle: TCardStyle;
};

export const CardStyleGlyph = ({ cardStyle }: TCardStyleGlyphProps) => {
  const { card, line, shortLine } = cardStyleGlyphVariants({ cardStyle });

  return (
    <span className={card()}>
      <span className={line()} />
      <span className={shortLine()} />
    </span>
  );
};
