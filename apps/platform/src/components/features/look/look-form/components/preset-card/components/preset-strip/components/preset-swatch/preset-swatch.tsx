import type { SIZE } from '@blog/config';
import type { TPresetSwatch } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { FONT_OPTIONS } from '@platform/config/fonts';

import { presetSwatchVariants } from './preset-swatch-variants';

type TPresetSwatchProps = {
  swatch: TPresetSwatch;
  size: typeof SIZE.SM | typeof SIZE.MD | typeof SIZE.LG;
};

export const PresetSwatch = ({ swatch, size }: TPresetSwatchProps) => {
  const { glyph, font, glyphSize, ground, ink } = swatch;

  return (
    <span
      className={presetSwatchVariants({ size, glyphSize })}
      style={{
        fontFamily: FONT_OPTIONS[font].fontFamily,
        backgroundColor: ground,
        color: ink,
      }}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
};
