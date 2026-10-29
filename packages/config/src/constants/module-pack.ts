import type { TMaybeNull } from '@blog/config/types';

import type { TValueOf } from '@blog/config/utils';

import type { TModuleType } from './module';

export const MODULE_PACK = {
  CORE: 'CORE',
  GROWTH: 'GROWTH',
} as const;

export type TModulePack = TValueOf<typeof MODULE_PACK>;

export const MODULE_PACK_BY_TYPE = {
  module_hero: MODULE_PACK.CORE,
  module_heroBlog: MODULE_PACK.CORE,
  module_heroStatement: MODULE_PACK.CORE,
  module_heroProfile: MODULE_PACK.CORE,
  module_postList: MODULE_PACK.CORE,
  module_postLatest: MODULE_PACK.CORE,
  module_postFeatured: MODULE_PACK.CORE,
  module_postRelated: MODULE_PACK.CORE,
  module_taxonomyList: MODULE_PACK.CORE,
  module_content: MODULE_PACK.CORE,
  module_faq: MODULE_PACK.CORE,
  module_sectionPages: MODULE_PACK.CORE,
  module_cta: MODULE_PACK.CORE,
  module_newsletter: MODULE_PACK.CORE,
  module_cookieSettings: MODULE_PACK.CORE,
  module_testimonial: MODULE_PACK.GROWTH,
  module_team: MODULE_PACK.GROWTH,
  module_logoWall: MODULE_PACK.GROWTH,
  module_stats: MODULE_PACK.GROWTH,
  module_pricing: MODULE_PACK.GROWTH,
  module_featureList: MODULE_PACK.GROWTH,
  module_featureHighlights: MODULE_PACK.GROWTH,
  module_timeline: MODULE_PACK.GROWTH,
  module_contactForm: MODULE_PACK.GROWTH,
} as const satisfies Record<TModuleType, TModulePack>;

const isModuleType = (type: string): type is TModuleType =>
  Object.hasOwn(MODULE_PACK_BY_TYPE, type);

export const getModulePack = (type: string): TMaybeNull<TModulePack> =>
  isModuleType(type) ? MODULE_PACK_BY_TYPE[type] : null;

export const isModuleTypeEntitled = (
  type: string,
  entitledPacks: readonly TModulePack[],
): boolean => {
  const pack = getModulePack(type);

  return pack !== null && entitledPacks.includes(pack);
};
