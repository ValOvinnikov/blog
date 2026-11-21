import { ICONS, type TLocaleIsoCode } from '@shinefold/config/constants';

import type { TStarterCopy } from './copy/starter-copy';
import { buildTimelineModule } from './growth-band-modules';
import { buildFeatureListModule } from './growth-feature-list-module';
import { growthHomeSlots, type TGrowthLayer } from './growth-layer-shape';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { moduleSlot } from './starter-fields';
import {
  FEATURES_MODULE_TITLE,
  TIMELINE_MODULE_TITLE,
} from './starter-module-titles';

const ids = STARTER_DOCUMENT_IDS;

export function buildPersonalGrowthLayer({
  locale,
  copy,
}: {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
}): TGrowthLayer {
  const { timeline, featureList } = copy.personal.growth;

  return {
    documents: [
      buildTimelineModule({
        id: ids.PERSONAL_TIMELINE,
        title: TIMELINE_MODULE_TITLE,
        locale,
        timeline,
      }),
      ...buildFeatureListModule({
        id: ids.PERSONAL_FEATURE_LIST,
        title: FEATURES_MODULE_TITLE,
        locale,
        featureList,
        icons: [ICONS.PEN, ICONS.LIGHTBULB, ICONS.USERS],
      }),
    ],
    homeSlots: growthHomeSlots(ids.PERSONAL_INTRO, [
      moduleSlot(ids.PERSONAL_TIMELINE, 'module_timeline'),
      moduleSlot(ids.PERSONAL_FEATURE_LIST, 'module_featureList'),
    ]),
  };
}
