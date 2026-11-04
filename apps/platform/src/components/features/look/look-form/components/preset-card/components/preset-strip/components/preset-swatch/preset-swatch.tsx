import { SIZE } from '@blog/config';
import type { TPresetSwatch } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { tv } from '@platform/utils/tv/tv';

const presetSwatchVariants = tv({
  base: [
    'flex shrink-0 items-center justify-center rounded-admin-3 font-semibold',
  ],
  variants: {
    size: {
      [SIZE.SM]: 'size-7',
      [SIZE.MD]: 'size-8',
      [SIZE.LG]: 'size-9',
    },
    glyphSize: {
      [SIZE.SM]: 'text-admin-11',
      [SIZE.LG]: 'text-admin-15',
    },
  },
});

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
