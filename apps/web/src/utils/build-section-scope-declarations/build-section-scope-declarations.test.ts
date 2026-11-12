import {
  BUTTON_SHAPE,
  BUTTON_SHAPE_DECLARATIONS,
  CARD_STYLE,
  CARD_STYLE_DECLARATIONS,
  DENSITY,
  DENSITY_DECLARATIONS,
  DERIVED_RADIUS_DECLARATIONS,
  DERIVED_SPACING_DECLARATIONS,
  RADIUS_DECLARATIONS,
  RADIUS_SCALE,
  type TCardStyle,
} from '@blog/config';
import {
  MOCK_NO_SECTION_STYLE_OVERRIDES,
  MOCK_SECTION_LOOK,
  MOCK_STALE_OPTION,
} from '@web/testing/shared/section-appearance/fixtures';

import { buildSectionScopeDeclarations } from './build-section-scope-declarations';

const build = (
  overrides: Parameters<typeof buildSectionScopeDeclarations>[0]['overrides'],
) => buildSectionScopeDeclarations({ overrides, look: MOCK_SECTION_LOOK });

describe(buildSectionScopeDeclarations, () => {
  it('declares nothing without an override', () => {
    expect(build(MOCK_NO_SECTION_STYLE_OVERRIDES)).toEqual({});
  });

  it('re-derives every radius chain from overridden corners', () => {
    expect(build({ radiusScale: RADIUS_SCALE.XL })).toEqual({
      ...RADIUS_DECLARATIONS[RADIUS_SCALE.XL],
      ...BUTTON_SHAPE_DECLARATIONS[BUTTON_SHAPE.ROUNDED],
      ...CARD_STYLE_DECLARATIONS[MOCK_SECTION_LOOK.cardStyle],
      ...DERIVED_RADIUS_DECLARATIONS,
    });
  });

  it('re-derives the item radius alias from an overridden card style', () => {
    expect(build({ cardStyle: CARD_STYLE.OUTLINED })).toEqual({
      ...CARD_STYLE_DECLARATIONS[CARD_STYLE.OUTLINED],
      ...DERIVED_RADIUS_DECLARATIONS,
    });
  });

  it('prefers an overridden card style over the site one', () => {
    const declarations = build({
      cardStyle: CARD_STYLE.OUTLINED,
      radiusScale: RADIUS_SCALE.XL,
    });

    expect(declarations).toMatchObject(
      CARD_STYLE_DECLARATIONS[CARD_STYLE.OUTLINED],
    );
  });

  it('re-derives the band spacing steps from an overridden density', () => {
    expect(build({ density: DENSITY.COMPACT })).toEqual({
      ...DENSITY_DECLARATIONS[DENSITY.COMPACT],
      ...DERIVED_SPACING_DECLARATIONS,
    });
  });

  it('ignores a value the declaration maps do not hold', () => {
    expect(build({ cardStyle: MOCK_STALE_OPTION as TCardStyle })).toEqual({});
  });
});
