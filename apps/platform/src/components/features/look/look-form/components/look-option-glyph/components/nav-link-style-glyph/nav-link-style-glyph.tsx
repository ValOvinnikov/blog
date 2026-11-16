import type { TNavLinkStyle } from '@shinefold/config';

import { navLinkStyleGlyphVariants } from './nav-link-style-glyph-variants';

export type TNavLinkStyleGlyphProps = {
  linkStyle: TNavLinkStyle;
  word: string;
};

export const NavLinkStyleGlyph = ({
  linkStyle,
  word,
}: TNavLinkStyleGlyphProps) => (
  <span className={navLinkStyleGlyphVariants({ linkStyle })}>{word}</span>
);
