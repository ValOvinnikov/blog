import { BRAND_VARIANT } from '@blog/config/constants';
import { brandVariantTitle } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { faker } from '@faker-js/faker';

faker.seed(4111);

const MOCK_DETAIL = faker.lorem.words(2);

describe(moduleSubtitle, () => {
  it.each([
    {
      behaviour: 'joins the brand variant and the detail with a middle dot',
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      detail: MOCK_DETAIL,
      expected: `${brandVariantTitle(BRAND_VARIANT.BRAND_PRIMARY)} · ${MOCK_DETAIL}`,
    },
    {
      behaviour: 'shows the brand variant alone when there is no detail',
      brandVariant: BRAND_VARIANT.PRIMARY,
      detail: undefined,
      expected: brandVariantTitle(BRAND_VARIANT.PRIMARY),
    },
    {
      behaviour: 'shows the detail alone when no brand variant is set',
      brandVariant: undefined,
      detail: MOCK_DETAIL,
      expected: MOCK_DETAIL,
    },
    {
      behaviour: 'is undefined when nothing is set',
      brandVariant: undefined,
      detail: undefined,
      expected: undefined,
    },
  ])('$behaviour', ({ brandVariant, detail, expected }) => {
    expect(moduleSubtitle(brandVariant, detail)).toBe(expected);
  });
});
