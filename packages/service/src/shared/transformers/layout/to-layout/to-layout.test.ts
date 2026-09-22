import { CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';

import { toLayout, type TRawLayout } from './to-layout';

const rawLayout: TRawLayout = {
  spacingTop: SPACING_SCALE.SM,
  spacingBottom: SPACING_SCALE.LG,
  containerWidth: CONTAINER_WIDTH.NARROW,
  dividerTop: true,
  dividerBottom: false,
};

describe('toLayout', () => {
  it('returns undefined when the raw field is null', () => {
    expect(toLayout(null)).toBeUndefined();
  });

  it('returns undefined when the raw field is undefined', () => {
    expect(toLayout(undefined)).toBeUndefined();
  });

  it('maps a fully-authored layout object 1:1', () => {
    expect(toLayout(rawLayout)).toEqual(rawLayout);
  });

  it('leaves individually-unset sub-fields undefined (no faked default)', () => {
    expect(
      toLayout({
        spacingTop: null,
        spacingBottom: null,
        containerWidth: null,
        dividerTop: null,
        dividerBottom: null,
      }),
    ).toEqual({
      spacingTop: undefined,
      spacingBottom: undefined,
      containerWidth: undefined,
      dividerTop: undefined,
      dividerBottom: undefined,
    });
  });

  it('maps a heroLayout raw object (no containerWidth) with containerWidth left undefined', () => {
    expect(
      toLayout({
        spacingTop: SPACING_SCALE.MD,
        spacingBottom: null,
        dividerTop: true,
        dividerBottom: null,
      }),
    ).toEqual({
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: undefined,
      containerWidth: undefined,
      dividerTop: true,
      dividerBottom: undefined,
    });
  });
});
