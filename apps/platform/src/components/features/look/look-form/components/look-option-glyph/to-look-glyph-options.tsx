import type { TSegmentedControlProps } from '@platform/components/shared/segmented-control';

import { LookOptionGlyph } from './look-option-glyph';
import type {
  TLookOptionGlyphField,
  TLookOptionGlyphValue,
} from './look-option-glyph-registry';

export const toLookGlyphOptions = <TField extends TLookOptionGlyphField>(
  field: TField,
  values:
    | Record<string, TLookOptionGlyphValue<TField>>
    | readonly TLookOptionGlyphValue<TField>[],
  labelFor: (value: TLookOptionGlyphValue<TField>) => string,
  descriptionFor?: (value: TLookOptionGlyphValue<TField>) => string,
): TSegmentedControlProps<TLookOptionGlyphValue<TField>>['options'] =>
  Object.values(values).map((value) => ({
    value,
    label: labelFor(value),
    ...(descriptionFor && { description: descriptionFor(value) }),
    glyph: <LookOptionGlyph field={field} value={value} />,
  }));
