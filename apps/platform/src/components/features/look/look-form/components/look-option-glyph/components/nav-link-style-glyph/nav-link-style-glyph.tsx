import type { TNavLinkStyle } from '@blog/config';

import { navLinkStyleGlyphVariants } from './nav-link-style-glyph-variants';

export type TNavLinkStyleGlyphProps = {
  linkStyle: TNavLinkStyle;
};

export const NavLinkStyleGlyph = ({ linkStyle }: TNavLinkStyleGlyphProps) => (
  <span className={navLinkStyleGlyphVariants({ linkStyle })}>Link</span>
);
