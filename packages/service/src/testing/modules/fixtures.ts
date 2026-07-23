import { HERO_FIELD_MODE, TLINK_TYPE } from '@blog/config';
import type { TRawContentModule } from '@blog/service/features/modules/content/adaptor/transformer';
import type { TRawCtaModule } from '@blog/service/features/modules/cta/adaptor/transformer';
import type { TRawHeroModule } from '@blog/service/features/modules/hero/adaptor/transformer';
import type { TRawPostListModule } from '@blog/service/features/modules/post-list/adaptor/transformer';

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

export function makeRawCtaModule(
  overrides: Partial<TRawCtaModule> = {},
): TRawCtaModule {
  return {
    heading: 'Subscribe to the newsletter',
    text: 'Get new posts in your inbox.',
    action: {
      label: 'Subscribe',
      linkType: TLINK_TYPE.EXTERNAL,
      url: '/newsletter',
      internalReference: null,
      openInNewTab: null,
      platform: null,
    },
    ...overrides,
  };
}
