import { SITE_TYPE, type TLocaleIsoCode } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';

import { buildBusinessGrowthLayer } from './business-growth';
import { STARTER_COPY_BY_LOCALE, type TStarterCopy } from './copy/starter-copy';
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
  Record<
    TStarterSiteType,
    (input: TGrowthInput & { copy: TStarterCopy }) => TGrowthLayer
  >
> = {
  [SITE_TYPE.PORTFOLIO]: buildPortfolioGrowthLayer,
  [SITE_TYPE.PERSONAL]: buildPersonalGrowthLayer,
  [SITE_TYPE.BUSINESS]: buildBusinessGrowthLayer,
  [SITE_TYPE.PRODUCT]: buildProductGrowthLayer,
};

export function buildGrowthLayer({
  siteType,
  ...input
}: TGrowthInput & { siteType: TStarterSiteType }): TMaybeNull<TGrowthLayer> {
  return (
    BUILD_GROWTH_BY_SITE_TYPE[siteType]?.({
      ...input,
      copy: STARTER_COPY_BY_LOCALE[input.locale],
    }) ?? null
  );
}
