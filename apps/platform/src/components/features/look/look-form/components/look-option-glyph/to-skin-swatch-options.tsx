import type { TSegmentedControlProps } from '@platform/components/shared/segmented-control';
import { SKIN_REGISTRY, type TBrandVariant } from '@shinefold/config';
import { objectKeys } from '@shinefold/utils/primitives';

import { SkinSwatchGlyph } from './components/skin-swatch-glyph/skin-swatch-glyph';

export const toSkinSwatchOptions = (
  accentHue: number,
  labelFor: (skin: TBrandVariant) => string,
): TSegmentedControlProps<TBrandVariant>['options'] =>
  objectKeys(SKIN_REGISTRY).map((skin) => ({
    value: skin,
    label: labelFor(skin),
    glyph: <SkinSwatchGlyph skin={skin} accentHue={accentHue} />,
  }));
