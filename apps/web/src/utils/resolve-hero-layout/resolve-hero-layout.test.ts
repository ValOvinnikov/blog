import { BRAND_VARIANT, HERO_VARIANT, SPACING_SCALE } from '@blog/config';
import { BANNER_SECTION_LAYOUT } from '@web/utils/banner-section-layout';

import { resolveHeroLayout } from './resolve-hero-layout';

const authoredLayout = {
  spacingTop: SPACING_SCALE.XL,
  spacingBottom: SPACING_SCALE.LG,
  dividerTop: true,
  dividerBottom: true,
};

describe(resolveHeroLayout.name, () => {
  it('gives a Banner an unpadded, undivided Primary Section', () => {
    const result = resolveHeroLayout({
      variant: HERO_VARIANT.BANNER,
      brandVariant: BRAND_VARIANT.SECONDARY,
      layout: authoredLayout,
    });

    expect(result.sectionBrandVariant).toBe(BRAND_VARIANT.PRIMARY);
    expect(result.sectionLayout).toBe(BANNER_SECTION_LAYOUT);
  });

  it('hands a Banner Hero the authored spacing', () => {
    const result = resolveHeroLayout({
      variant: HERO_VARIANT.BANNER,
      brandVariant: BRAND_VARIANT.SECONDARY,
      layout: authoredLayout,
    });

    expect(result.heroSpacingTop).toBe(SPACING_SCALE.XL);
    expect(result.heroSpacingBottom).toBe(SPACING_SCALE.LG);
  });

  it.each([HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED])(
    'keeps the authored Section and no Hero spacing for %s',
    (variant) => {
      const result = resolveHeroLayout({
        variant,
        brandVariant: BRAND_VARIANT.SECONDARY,
        layout: authoredLayout,
      });

      expect(result).toEqual({
        sectionBrandVariant: BRAND_VARIANT.SECONDARY,
        sectionLayout: authoredLayout,
        heroSpacingTop: undefined,
        heroSpacingBottom: undefined,
      });
    },
  );
});
