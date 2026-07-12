import { HERO_FIELD_MODE } from '@blog/config';

import type { TRawContentModule } from '#/features/modules/content/adaptor/transformer';
import type { TRawHeroModule } from '#/features/modules/hero/adaptor/transformer';
import type { TRawPostListModule } from '#/features/modules/post-list/adaptor/transformer';

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

export function makeRawPostListModule(
  overrides: Partial<TRawPostListModule> = {},
): TRawPostListModule {
  return {
    title: 'Latest',
    limit: 6,
    ...overrides,
  };
}

export function makeRawContentModule(
  overrides: Partial<TRawContentModule> = {},
): TRawContentModule {
  return {
    title: 'About us',
    body: [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'span-1', text: 'Hello.' }],
      },
    ],
    ...overrides,
  };
}
