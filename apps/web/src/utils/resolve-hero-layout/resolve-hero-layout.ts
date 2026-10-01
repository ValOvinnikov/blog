import {
  BRAND_VARIANT,
  HERO_VARIANT,
  type TBrandVariant,
  type THeroVariant,
  type TLayout,
  type TMaybeUndefined,
  type TSpacingScale,
} from '@blog/config';
import { BANNER_SECTION_LAYOUT } from '@web/utils/banner-section-layout';

interface IResolveHeroLayoutInput {
  variant: THeroVariant;
  brandVariant: TBrandVariant;
  layout: TMaybeUndefined<TLayout>;
}

interface IResolvedHeroLayout {
  sectionBrandVariant: TBrandVariant;
  sectionLayout: TMaybeUndefined<TLayout>;
  heroSpacingTop: TMaybeUndefined<TSpacingScale>;
  heroSpacingBottom: TMaybeUndefined<TSpacingScale>;
}

export const resolveHeroLayout = ({
  variant,
  brandVariant,
  layout,
}: IResolveHeroLayoutInput): IResolvedHeroLayout => {
  if (variant !== HERO_VARIANT.BANNER) {
    return {
      sectionBrandVariant: brandVariant,
      sectionLayout: layout,
      heroSpacingTop: undefined,
      heroSpacingBottom: undefined,
    };
  }

  return {
    sectionBrandVariant: BRAND_VARIANT.PRIMARY,
    sectionLayout: BANNER_SECTION_LAYOUT,
    heroSpacingTop: layout?.spacingTop,
    heroSpacingBottom: layout?.spacingBottom,
  };
};
