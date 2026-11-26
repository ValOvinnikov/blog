import type { TSegmentedControlProps } from '@platform/components/shared/segmented-control';
import { SKIN_REGISTRY, type TBrandVariant } from '@shinefold/config';
import { keys } from 'remeda';

import { SkinSwatchGlyph } from './components/skin-swatch-glyph/skin-swatch-glyph';

export const toSkinSwatchOptions = (
  accentHue: number,
  labelFor: (skin: TBrandVariant) => string,
): TSegmentedControlProps<TBrandVariant>['options'] =>
  keys(SKIN_REGISTRY).map((skin) => ({
    value: skin,
    label: labelFor(skin),
    glyph: <SkinSwatchGlyph skin={skin} accentHue={accentHue} />,
  }));
