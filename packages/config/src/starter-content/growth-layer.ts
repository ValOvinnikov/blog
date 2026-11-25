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

type TCopyInput = { copy: TStarterCopy };

type TGrowthLayerBuilder =
  | {
      usesPlaceholderImages: true;
      build: (input: TGrowthInput) => TGrowthLayer;
    }
  | {
      usesPlaceholderImages: false;
      build: (input: Pick<TGrowthInput, 'locale'>) => TGrowthLayer;
    };

type TCopiedGrowthLayerBuilder =
  | {
      usesPlaceholderImages: true;
      build: (input: TGrowthInput & TCopyInput) => TGrowthLayer;
    }
  | {
      usesPlaceholderImages: false;
      build: (input: Pick<TGrowthInput, 'locale'> & TCopyInput) => TGrowthLayer;
    };

const GROWTH_LAYER_BUILDER_BY_SITE_TYPE: Partial<
  Record<TStarterSiteType, TCopiedGrowthLayerBuilder>
> = {
  [SITE_TYPE.PORTFOLIO]: {
    usesPlaceholderImages: true,
    build: buildPortfolioGrowthLayer,
  },
  [SITE_TYPE.PERSONAL]: {
    usesPlaceholderImages: false,
    build: buildPersonalGrowthLayer,
  },
  [SITE_TYPE.BUSINESS]: {
    usesPlaceholderImages: true,
    build: buildBusinessGrowthLayer,
  },
  [SITE_TYPE.PRODUCT]: {
    usesPlaceholderImages: true,
    build: buildProductGrowthLayer,
  },
};

function withLocaleCopy<TInput extends Pick<TGrowthInput, 'locale'>>(
  build: (input: TInput & TCopyInput) => TGrowthLayer,
) {
  return (input: TInput) =>
    build({ ...input, copy: STARTER_COPY_BY_LOCALE[input.locale] });
}

export function getGrowthLayerBuilder(
  siteType: TStarterSiteType,
): TMaybeNull<TGrowthLayerBuilder> {
  const builder = GROWTH_LAYER_BUILDER_BY_SITE_TYPE[siteType];
  if (!builder) return null;
  return builder.usesPlaceholderImages
    ? {
        usesPlaceholderImages: true,
        build: withLocaleCopy<TGrowthInput>(builder.build),
      }
    : {
        usesPlaceholderImages: false,
        build: withLocaleCopy<Pick<TGrowthInput, 'locale'>>(builder.build),
      };
}

export function buildGrowthLayer({
  siteType,
  ...input
}: TGrowthInput & { siteType: TStarterSiteType }): TMaybeNull<TGrowthLayer> {
  return getGrowthLayerBuilder(siteType)?.build(input) ?? null;
}
