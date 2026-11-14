import type { TBrandVariant } from '@blog/config';
import { buildAccentPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { CSSProperties } from 'react';

import { footerBackgroundGlyphVariants } from './footer-background-glyph-variants';

export type TFooterBackgroundGlyphProps = {
  background: TBrandVariant;
  accentHue: number;
};

export const FooterBackgroundGlyph = ({
  background,
  accentHue,
}: TFooterBackgroundGlyphProps) => {
  const { swatch, line } = footerBackgroundGlyphVariants({ background });

  return (
    <span
      className={swatch()}
      style={buildAccentPreviewTokens(accentHue, false) as CSSProperties}
    >
      <span className={line()} />
    </span>
  );
};
