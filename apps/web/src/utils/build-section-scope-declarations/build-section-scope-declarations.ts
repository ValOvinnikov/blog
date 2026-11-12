import {
  BUTTON_SHAPE_DECLARATIONS,
  CARD_STYLE_DECLARATIONS,
  DENSITY_DECLARATIONS,
  DERIVED_RADIUS_DECLARATIONS,
  DERIVED_SPACING_DECLARATIONS,
  RADIUS_DECLARATIONS,
  type TButtonShape,
  type TCardStyle,
  type TMaybeUndefined,
  type TThemeDeclarations,
} from '@blog/config';
import { isOneOf } from '@blog/utils/primitives';
import type { TSectionStyleOverrides } from '@web/utils/gate-section-style-overrides';

export type TSectionAppearance = {
  overrides: TSectionStyleOverrides;
  look: { cardStyle: TCardStyle; buttonShape: TButtonShape };
};

const declarationsFor = <TKey extends string>(
  declarations: Record<TKey, TThemeDeclarations>,
  key: TMaybeUndefined<string>,
): TMaybeUndefined<TThemeDeclarations> =>
  isOneOf(Object.keys(declarations) as TKey[], key)
    ? declarations[key]
    : undefined;

/** The one formatter for a nested token scope: it re-emits every chain derived from an overridden token, and never a colour. */
export const buildSectionScopeDeclarations = ({
  overrides,
  look,
}: TSectionAppearance): TThemeDeclarations => {
  const radius = declarationsFor(RADIUS_DECLARATIONS, overrides.radiusScale);
  const density = declarationsFor(DENSITY_DECLARATIONS, overrides.density);
  const itemCard =
    declarationsFor(CARD_STYLE_DECLARATIONS, overrides.cardStyle) ??
    (radius && CARD_STYLE_DECLARATIONS[look.cardStyle]);

  return {
    ...radius,
    ...(radius && BUTTON_SHAPE_DECLARATIONS[look.buttonShape]),
    ...itemCard,
    ...(itemCard && DERIVED_RADIUS_DECLARATIONS),
    ...density,
    ...(density && DERIVED_SPACING_DECLARATIONS),
  };
};
