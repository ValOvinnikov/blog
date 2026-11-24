import { buildAccentPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import {
  BRAND_PALETTE,
  formatOklchRamp,
  type TBrandVariant,
} from '@shinefold/config';
import type { CSSProperties } from 'react';

import { skinSwatchGlyphVariants } from './skin-swatch-glyph-variants';

export type TSkinSwatchGlyphProps = {
  skin: TBrandVariant;
  accentHue: number;
};

export const SkinSwatchGlyph = ({ skin, accentHue }: TSkinSwatchGlyphProps) => {
  const { swatch, line } = skinSwatchGlyphVariants();

  return (
    <span
      className={swatch()}
      data-skin={skin}
      style={
        {
          ...formatOklchRamp(BRAND_PALETTE, accentHue),
          ...buildAccentPreviewTokens(accentHue, false),
        } as CSSProperties
      }
    >
      <span className={line()} />
    </span>
  );
};
