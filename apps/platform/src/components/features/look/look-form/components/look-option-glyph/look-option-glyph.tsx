import type { TGlyph } from '@platform/components/shared/icon';
import { iconVariants } from '@platform/components/shared/icon/icon-variants';
import { ICON_SIZE } from '@platform/constants/icon';

import {
  LOOK_OPTION_GLYPH_REGISTRY,
  type TLookOptionGlyphField,
  type TLookOptionGlyphValue,
} from './look-option-glyph-registry';

export type TLookOptionGlyphProps<TField extends TLookOptionGlyphField> = {
  field: TField;
  value: TLookOptionGlyphValue<TField>;
};

export const LookOptionGlyph = <TField extends TLookOptionGlyphField>({
  field,
  value,
}: TLookOptionGlyphProps<TField>) => {
  const Glyph: TGlyph = LOOK_OPTION_GLYPH_REGISTRY[field][value];

  return (
    <Glyph
      aria-hidden={true}
      className={iconVariants({ size: ICON_SIZE.XXL })}
    />
  );
};
