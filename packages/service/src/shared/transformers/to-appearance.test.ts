import { ALIGN, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';

import { toAppearance, type TRawAppearance } from './to-appearance';

const rawAppearance: TRawAppearance = {
  spacingTop: SPACING_SCALE.SM,
  spacingBottom: SPACING_SCALE.LG,
  containerWidth: CONTAINER_WIDTH.NARROW,
  align: ALIGN.CENTER,
  divider: true,
};

describe('toAppearance', () => {
  it('returns undefined when the raw field is null', () => {
    expect(toAppearance(null)).toBeUndefined();
  });

  it('returns undefined when the raw field is undefined', () => {
    expect(toAppearance(undefined)).toBeUndefined();
  });

  it('maps a fully-authored appearance object 1:1', () => {
    expect(toAppearance(rawAppearance)).toEqual(rawAppearance);
  });

  it('leaves individually-unset sub-fields undefined (no faked default)', () => {
    expect(
      toAppearance({
        spacingTop: null,
        spacingBottom: null,
        containerWidth: null,
        align: null,
        divider: null,
      }),
    ).toEqual({
      spacingTop: undefined,
      spacingBottom: undefined,
      containerWidth: undefined,
      align: undefined,
      divider: undefined,
    });
  });

  it('maps a partially-authored object, passing set fields through and leaving the rest undefined', () => {
    expect(
      toAppearance({
        spacingTop: SPACING_SCALE.SM,
        spacingBottom: null,
        containerWidth: null,
        align: null,
        divider: null,
      }),
    ).toEqual({
      spacingTop: SPACING_SCALE.SM,
      spacingBottom: undefined,
      containerWidth: undefined,
      align: undefined,
      divider: undefined,
    });
  });
});
