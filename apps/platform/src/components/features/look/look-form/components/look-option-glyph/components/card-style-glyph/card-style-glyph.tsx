import type { TCardStyle } from '@blog/config';

import { cardStyleGlyphVariants } from './card-style-glyph-variants';

export type TCardStyleGlyphProps = {
  cardStyle: TCardStyle;
};

export const CardStyleGlyph = ({ cardStyle }: TCardStyleGlyphProps) => {
  const { card, bar, line, shortLine } = cardStyleGlyphVariants({ cardStyle });

  return (
    <span className={card()}>
      <span className={bar()} />
      <span className={line()} />
      <span className={shortLine()} />
    </span>
  );
};
