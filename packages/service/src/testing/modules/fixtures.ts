import { HERO_FIELD_MODE } from '@blog/config';

import type { TRawHeroModule } from '#/features/modules/hero/adaptor/transformer';

export function makeRawHeroModule(
  overrides: Partial<TRawHeroModule> = {},
): TRawHeroModule {
  return {
    featuredPost: null,
    heroEyebrowMode: HERO_FIELD_MODE.POST_CATEGORY,
    heroEyebrow: null,
    heroTitleMode: HERO_FIELD_MODE.POST_TITLE,
    heroTitle: null,
    heroSubtitleMode: HERO_FIELD_MODE.POST_EXCERPT,
    heroSubtitle: null,
    heroImageMode: HERO_FIELD_MODE.POST_IMAGE,
    heroImage: null,
    heroImageAsset: null,
    primaryActionLabel: null,
    secondaryAction: null,
    ...overrides,
  };
}
