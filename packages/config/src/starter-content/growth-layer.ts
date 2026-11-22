import { SITE_TYPE, type TLocaleIsoCode } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';

import { buildBusinessGrowthLayer } from './business-growth';
import { STARTER_COPY_BY_LOCALE } from './copy/starter-copy';
import type {
  TGrowthLayer,
  TStarterPlaceholderImageIds,
} from './growth-layer-shape';
import { buildPersonalGrowthLayer } from './personal-growth';
import { buildPortfolioGrowthLayer } from './portfolio-growth';
import { buildProductGrowthLayer } from './product-growth';
import type { TStarterSiteType } from './starter-content';

type TGrowthInput = {
  locale: TLocaleIsoCode;
  placeholderImages: TStarterPlaceholderImageIds;
};

const BUILD_GROWTH_BY_SITE_TYPE: Partial<
  Record<TStarterSiteType, (input: TGrowthInput) => TGrowthLayer>
> = {
  [SITE_TYPE.PORTFOLIO]: ({ locale, placeholderImages }) =>
    buildPortfolioGrowthLayer({
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
      placeholderImages,
    }),
  [SITE_TYPE.PERSONAL]: ({ locale }) =>
    buildPersonalGrowthLayer({ locale, copy: STARTER_COPY_BY_LOCALE[locale] }),
  [SITE_TYPE.BUSINESS]: ({ locale, placeholderImages }) =>
    buildBusinessGrowthLayer({
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
      placeholderImages,
    }),
  [SITE_TYPE.PRODUCT]: ({ locale, placeholderImages }) =>
    buildProductGrowthLayer({
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
      placeholderImages,
    }),
};

export function buildGrowthLayer({
  siteType,
  ...input
}: TGrowthInput & { siteType: TStarterSiteType }): TMaybeNull<TGrowthLayer> {
  return BUILD_GROWTH_BY_SITE_TYPE[siteType]?.(input) ?? null;
}
