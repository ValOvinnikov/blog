import { buildAccentPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import {
  SKIN_MODE,
  SKIN_REGISTRY,
  type TBrandVariant,
} from '@shinefold/config';
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
  const isInverse = SKIN_REGISTRY[background].mode === SKIN_MODE.INVERSE;

  return (
    <span
      className={swatch()}
      data-skin={isInverse ? background : undefined}
      style={buildAccentPreviewTokens(accentHue, false) as CSSProperties}
    >
      <span className={line()} />
    </span>
  );
};
