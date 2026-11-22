import {
  STARTER_PLACEHOLDER_IMAGE,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';

import type { TStarterCopy } from './copy/starter-copy';
import { buildTimelineModule } from './growth-band-modules';
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
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { moduleSlot } from './starter-fields';
import {
  LOGO_WALL_MODULE_TITLE,
  TESTIMONIALS_MODULE_TITLE,
  TIMELINE_MODULE_TITLE,
} from './starter-module-titles';

const ids = STARTER_DOCUMENT_IDS;

export function buildPortfolioGrowthLayer({
  locale,
  copy,
  placeholderImages,
}: {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
  placeholderImages: TStarterPlaceholderImageIds;
}): TGrowthLayer {
  const { highlights, logoWall, timeline, testimonial } = copy.portfolio.growth;

  return {
    documents: [
      buildFeatureHighlightsModule({
        id: ids.PORTFOLIO_HIGHLIGHTS,
        title: 'How I Work',
        locale,
        highlights,
        imageAssetId: placeholderImages[STARTER_PLACEHOLDER_IMAGE.ILLUSTRATION],
      }),
      buildLogoWallModule({
        id: ids.PORTFOLIO_LOGO_WALL,
        title: LOGO_WALL_MODULE_TITLE,
        locale,
        logoWall,
        logoAssetId: placeholderImages[STARTER_PLACEHOLDER_IMAGE.LOGO],
      }),
      buildTimelineModule({
        id: ids.PORTFOLIO_TIMELINE,
        title: TIMELINE_MODULE_TITLE,
        locale,
        timeline,
      }),
      ...buildTestimonialModule({
        id: ids.PORTFOLIO_TESTIMONIAL,
        title: TESTIMONIALS_MODULE_TITLE,
        locale,
        testimonial,
      }),
    ],
    homeSlots: growthHomeSlots(ids.PORTFOLIO_INTRO, [
      moduleSlot(ids.PORTFOLIO_HIGHLIGHTS, 'module_featureHighlights'),
      moduleSlot(ids.PORTFOLIO_LOGO_WALL, 'module_logoWall'),
      moduleSlot(ids.PORTFOLIO_TIMELINE, 'module_timeline'),
      moduleSlot(ids.PORTFOLIO_TESTIMONIAL, 'module_testimonial'),
    ]),
  };
}
