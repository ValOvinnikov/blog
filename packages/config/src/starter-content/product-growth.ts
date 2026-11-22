import {
  ICONS,
  STARTER_PLACEHOLDER_IMAGE,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';

import type { TStarterCopy } from './copy/starter-copy';
import { buildStatsModule } from './growth-band-modules';
import { buildFeatureListModule } from './growth-feature-list-module';
import {
  growthHomeSlots,
  type TGrowthLayer,
  type TStarterPlaceholderImageIds,
} from './growth-layer-shape';
import {
  buildFeatureHighlightsModule,
  buildLogoWallModule,
} from './growth-media-modules';
import { buildTestimonialModule } from './growth-people-modules';
import { buildPricingModule } from './growth-pricing-module';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { moduleSlot } from './starter-fields';
import {
  FEATURES_MODULE_TITLE,
  LOGO_WALL_MODULE_TITLE,
  STATS_MODULE_TITLE,
  TESTIMONIALS_MODULE_TITLE,
} from './starter-module-titles';

const ids = STARTER_DOCUMENT_IDS;

export function buildProductGrowthLayer({
  locale,
  copy,
  placeholderImages,
}: {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
  placeholderImages: TStarterPlaceholderImageIds;
}): TGrowthLayer {
  const { highlights, featureList, stats, testimonial, logoWall, pricing } =
    copy.product.growth;

  return {
    documents: [
      buildFeatureHighlightsModule({
        id: ids.PRODUCT_HIGHLIGHTS,
        title: 'Highlights',
        locale,
        highlights,
        imageAssetId: placeholderImages[STARTER_PLACEHOLDER_IMAGE.ILLUSTRATION],
      }),
      ...buildFeatureListModule({
        id: ids.PRODUCT_FEATURE_LIST,
        title: FEATURES_MODULE_TITLE,
        locale,
        featureList,
        icons: [ICONS.ZAP, ICONS.LAYERS, ICONS.LOCK],
      }),
      buildStatsModule({
        id: ids.PRODUCT_STATS,
        title: STATS_MODULE_TITLE,
        locale,
        stats,
      }),
      ...buildTestimonialModule({
        id: ids.PRODUCT_TESTIMONIAL,
        title: TESTIMONIALS_MODULE_TITLE,
        locale,
        testimonial,
      }),
      buildLogoWallModule({
        id: ids.PRODUCT_LOGO_WALL,
        title: LOGO_WALL_MODULE_TITLE,
        locale,
        logoWall,
        logoAssetId: placeholderImages[STARTER_PLACEHOLDER_IMAGE.LOGO],
      }),
      buildPricingModule({
        id: ids.PRODUCT_PRICING,
        title: 'Pricing',
        locale,
        pricing,
      }),
    ],
    homeSlots: growthHomeSlots(ids.PRODUCT_INTRO, [
      moduleSlot(ids.PRODUCT_HIGHLIGHTS, 'module_featureHighlights'),
      moduleSlot(ids.PRODUCT_FEATURE_LIST, 'module_featureList'),
      moduleSlot(ids.PRODUCT_STATS, 'module_stats'),
      moduleSlot(ids.PRODUCT_TESTIMONIAL, 'module_testimonial'),
      moduleSlot(ids.PRODUCT_LOGO_WALL, 'module_logoWall'),
      moduleSlot(ids.PRODUCT_PRICING, 'module_pricing'),
    ]),
  };
}
