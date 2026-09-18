import { BRAND_VARIANT } from '@blog/config/constants';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';

describe('brandVariantField', () => {
  it('defaults the initial value to the first item of the list', () => {
    expect(brandVariantField().initialValue).toBe(BRAND_VARIANT.PRIMARY);
    expect(
      brandVariantField({
        list: [BRAND_VARIANT.SECONDARY, BRAND_VARIANT.PRIMARY],
      }).initialValue,
    ).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('keeps an explicit initial value over the list default', () => {
    expect(
      brandVariantField({ initialValue: BRAND_VARIANT.SECONDARY }).initialValue,
    ).toBe(BRAND_VARIANT.SECONDARY);
  });
});
