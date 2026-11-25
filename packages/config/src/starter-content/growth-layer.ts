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

type TGrowthLayerBuilder =
  | {
      usesPlaceholderImages: true;
      build: (input: TGrowthInput) => TGrowthLayer;
    }
  | {
      usesPlaceholderImages: false;
      build: (input: Pick<TGrowthInput, 'locale'>) => TGrowthLayer;
    };

const GROWTH_LAYER_BUILDER_BY_SITE_TYPE: Partial<
  Record<TStarterSiteType, TGrowthLayerBuilder>
> = {
  [SITE_TYPE.PORTFOLIO]: {
    usesPlaceholderImages: true,
    build: ({ locale, placeholderImages }) =>
      buildPortfolioGrowthLayer({
        locale,
        copy: STARTER_COPY_BY_LOCALE[locale],
        placeholderImages,
      }),
  },
  [SITE_TYPE.PERSONAL]: {
    usesPlaceholderImages: false,
    build: ({ locale }) =>
      buildPersonalGrowthLayer({
        locale,
        copy: STARTER_COPY_BY_LOCALE[locale],
      }),
  },
  [SITE_TYPE.BUSINESS]: {
    usesPlaceholderImages: true,
    build: ({ locale, placeholderImages }) =>
      buildBusinessGrowthLayer({
        locale,
        copy: STARTER_COPY_BY_LOCALE[locale],
        placeholderImages,
      }),
  },
  [SITE_TYPE.PRODUCT]: {
    usesPlaceholderImages: true,
    build: ({ locale, placeholderImages }) =>
      buildProductGrowthLayer({
        locale,
        copy: STARTER_COPY_BY_LOCALE[locale],
        placeholderImages,
      }),
  },
};

export function getGrowthLayerBuilder(
  siteType: TStarterSiteType,
): TMaybeNull<TGrowthLayerBuilder> {
  return GROWTH_LAYER_BUILDER_BY_SITE_TYPE[siteType] ?? null;
}

export function buildGrowthLayer({
  siteType,
  ...input
}: TGrowthInput & { siteType: TStarterSiteType }): TMaybeNull<TGrowthLayer> {
  return getGrowthLayerBuilder(siteType)?.build(input) ?? null;
}
