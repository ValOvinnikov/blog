import {
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
  SPACING_SCALE,
} from '@blog/config/constants';

import { appearanceToLayout } from './transform';

describe(appearanceToLayout, () => {
  it('maps the divider onto both the top and bottom dividers', () => {
    const result = appearanceToLayout(
      {
        appearance: {
          spacingTop: SPACING_SCALE.LG,
          spacingBottom: SPACING_SCALE.SM,
          divider: true,
        },
      },
      { includeContainerWidth: false },
    );

    expect(result).toEqual({
      spacingTop: SPACING_SCALE.LG,
      spacingBottom: SPACING_SCALE.SM,
      dividerTop: true,
      dividerBottom: true,
    });
  });

  it('copies a divider that is switched off', () => {
    const result = appearanceToLayout(
      { appearance: { divider: false } },
      { includeContainerWidth: false },
    );

    expect(result).toEqual({ dividerTop: false, dividerBottom: false });
  });

  it.each([
    [true, { containerWidth: CONTAINER_WIDTH.WIDE }],
    [false, {}],
  ])(
    'copies the container width only when allowed (allowed: %s)',
    (includeContainerWidth, expected) => {
      const result = appearanceToLayout(
        { appearance: { containerWidth: CONTAINER_WIDTH.WIDE } },
        { includeContainerWidth },
      );

      expect(result).toEqual(expected);
    },
  );

  it('never copies the alignment', () => {
    const result = appearanceToLayout(
      { appearance: { align: CONTENT_ALIGNMENT.LEFT } },
      { includeContainerWidth: true },
    );

    expect(result).toEqual({});
  });

  it('returns undefined when appearance is absent', () => {
    const result = appearanceToLayout({}, { includeContainerWidth: false });

    expect(result).toBeUndefined();
  });

  it('treats a null layout as not yet migrated', () => {
    const result = appearanceToLayout(
      { appearance: { spacingTop: SPACING_SCALE.LG }, layout: null },
      { includeContainerWidth: false },
    );

    expect(result).toEqual({ spacingTop: SPACING_SCALE.LG });
  });
});
