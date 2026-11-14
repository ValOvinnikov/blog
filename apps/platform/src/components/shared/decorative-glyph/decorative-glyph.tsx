import type { IWithClassName } from '@blog/config/types';
import type { ReactNode } from 'react';

export type TDecorativeGlyphProps = IWithClassName & {
  glyph?: ReactNode;
};

export const DecorativeGlyph = ({ glyph, className }: TDecorativeGlyphProps) =>
  glyph ? (
    <span aria-hidden={true} className={className}>
      {glyph}
    </span>
  ) : null;
