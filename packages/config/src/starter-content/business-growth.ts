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
import { buildLogoWallModule } from './growth-media-modules';
import {
  buildTeamModule,
  buildTestimonialModule,
} from './growth-people-modules';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { moduleSlot } from './starter-fields';
import {
  FEATURES_MODULE_TITLE,
  LOGO_WALL_MODULE_TITLE,
  STATS_MODULE_TITLE,
  TESTIMONIALS_MODULE_TITLE,
} from './starter-module-titles';

const ids = STARTER_DOCUMENT_IDS;

export function buildBusinessGrowthLayer({
  locale,
  copy,
  placeholderImages,
}: {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
  placeholderImages: TStarterPlaceholderImageIds;
}): TGrowthLayer {
  const { featureList, stats, logoWall, team, testimonial } =
    copy.business.growth;

  return {
    documents: [
      ...buildFeatureListModule({
        id: ids.BUSINESS_FEATURE_LIST,
        title: FEATURES_MODULE_TITLE,
        locale,
        featureList,
        icons: [ICONS.TARGET, ICONS.WRENCH, ICONS.SHIELD_CHECK],
      }),
      buildStatsModule({
        id: ids.BUSINESS_STATS,
        title: STATS_MODULE_TITLE,
        locale,
        stats,
      }),
      buildLogoWallModule({
        id: ids.BUSINESS_LOGO_WALL,
        title: LOGO_WALL_MODULE_TITLE,
        locale,
        logoWall,
        logoAssetId: placeholderImages[STARTER_PLACEHOLDER_IMAGE.LOGO],
      }),
      ...buildTeamModule({
        id: ids.BUSINESS_TEAM,
        title: 'Team',
        locale,
        team,
      }),
      ...buildTestimonialModule({
        id: ids.BUSINESS_TESTIMONIAL,
        title: TESTIMONIALS_MODULE_TITLE,
        locale,
        testimonial,
      }),
    ],
    homeSlots: growthHomeSlots(ids.BUSINESS_INTRO, [
      moduleSlot(ids.BUSINESS_FEATURE_LIST, 'module_featureList'),
      moduleSlot(ids.BUSINESS_STATS, 'module_stats'),
      moduleSlot(ids.BUSINESS_LOGO_WALL, 'module_logoWall'),
      moduleSlot(ids.BUSINESS_TEAM, 'module_team'),
      moduleSlot(ids.BUSINESS_TESTIMONIAL, 'module_testimonial'),
    ]),
  };
}
