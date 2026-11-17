import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { isNull } from '@shinefold/utils/primitives';

import type { TValueOf } from '@shinefold/config/utils';

import { CAPABILITY, type TCapability } from './capability';
import type { TModuleType } from './module';

export const MODULE_PACK = {
  CORE: 'CORE',
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
} as const;

export type TModulePack = TValueOf<typeof MODULE_PACK>;

export const MODULE_PACK_BY_TYPE = {
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
  module_embed: MODULE_PACK.CORE,
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
  module_contactForm: MODULE_PACK.STARTER,
} as const satisfies Record<TModuleType, TModulePack>;

const isModuleType = (type: string): type is TModuleType =>
  Object.hasOwn(MODULE_PACK_BY_TYPE, type);

export const getModulePack = (type: string): TMaybeNull<TModulePack> =>
  isModuleType(type) ? MODULE_PACK_BY_TYPE[type] : null;

export const CAPABILITY_BY_MODULE_TYPE = {
  module_newsletter: CAPABILITY.NEWSLETTER,
  module_contactForm: CAPABILITY.CONTACT_FORM,
} as const satisfies Partial<Record<TModuleType, TCapability>>;

const isCapabilityGatedModuleType = (
  type: string,
): type is keyof typeof CAPABILITY_BY_MODULE_TYPE =>
  Object.hasOwn(CAPABILITY_BY_MODULE_TYPE, type);

export const getModuleCapability = (
  type: string,
): TMaybeUndefined<TCapability> =>
  isCapabilityGatedModuleType(type)
    ? CAPABILITY_BY_MODULE_TYPE[type]
    : undefined;

export const isModuleTypeEntitled = (
  type: string,
  entitledPacks: readonly TModulePack[],
): boolean => {
  const pack = getModulePack(type);

  return !isNull(pack) && entitledPacks.includes(pack);
};
