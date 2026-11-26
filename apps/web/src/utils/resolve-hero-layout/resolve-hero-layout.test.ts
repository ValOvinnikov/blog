import { BRAND_VARIANT, HERO_VARIANT, SPACING_SCALE } from '@shinefold/config';
import { BANNER_SECTION_LAYOUT } from '@web/utils/banner-section-layout';

import { resolveHeroLayout } from './resolve-hero-layout';

const MOCK_AUTHORED_LAYOUT = {
  spacingTop: SPACING_SCALE.XL,
  spacingBottom: SPACING_SCALE.LG,
  dividerTop: true,
  dividerBottom: true,
};

describe(resolveHeroLayout, () => {
  describe('for a Banner', () => {
    let result: ReturnType<typeof resolveHeroLayout>;

    beforeEach(() => {
      result = resolveHeroLayout({
        variant: HERO_VARIANT.BANNER,
        brandVariant: BRAND_VARIANT.SECONDARY,
        layout: MOCK_AUTHORED_LAYOUT,
      });
    });

    it('gives the Section an unpadded, undivided Primary layout', () => {
      expect(result.sectionBrandVariant).toBe(BRAND_VARIANT.PRIMARY);
      expect(result.sectionLayout).toBe(BANNER_SECTION_LAYOUT);
    });

    it('hands the Hero the authored spacing', () => {
      expect(result.heroSpacingTop).toBe(SPACING_SCALE.XL);
      expect(result.heroSpacingBottom).toBe(SPACING_SCALE.LG);
    });
  });

  it.each([HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED])(
    'keeps the authored Section and no Hero spacing for %s',
    (variant) => {
      const result = resolveHeroLayout({
        variant,
        brandVariant: BRAND_VARIANT.SECONDARY,
        layout: MOCK_AUTHORED_LAYOUT,
      });

      expect(result).toEqual({
        sectionBrandVariant: BRAND_VARIANT.SECONDARY,
        sectionLayout: MOCK_AUTHORED_LAYOUT,
        heroSpacingTop: undefined,
        heroSpacingBottom: undefined,
      });
    },
  );
});
