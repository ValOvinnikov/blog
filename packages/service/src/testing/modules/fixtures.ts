import { BRAND_VARIANT, HERO_FIELD_MODE, TLINK_TYPE } from '@blog/config';
import type { TRawContentModule } from '@blog/service/features/modules/content/adaptor/transformer';
import type { TRawCtaModule } from '@blog/service/features/modules/cta/adaptor/transformer';
import type { TRawHeroModule } from '@blog/service/features/modules/hero/adaptor/transformer';
import type { TRawNewsletterModule } from '@blog/service/features/modules/newsletter/adaptor/transformer';
import type { TRawPostLatestModule } from '@blog/service/features/modules/post-latest/adaptor/transformer';
import type { TRawPostListModule } from '@blog/service/features/modules/post-list/adaptor/transformer';
import type { TRawTaxonomyListModule } from '@blog/service/features/modules/taxonomy-list/adaptor/transformer';

export function makeRawHeroModule(
  overrides: Partial<TRawHeroModule> = {},
): TRawHeroModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
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
    layout: null,
    ...overrides,
  };
}

export function makeRawPostListModule(
  overrides: Partial<TRawPostListModule> = {},
): TRawPostListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: { heading: 'Latest', supportingText: null, align: null },
    pageSize: 6,
    layout: null,
    ...overrides,
  };
}

export function makeRawPostLatestModule(
  overrides: Partial<TRawPostLatestModule> = {},
): TRawPostLatestModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: { heading: 'Latest', supportingText: null, align: null },
    limit: 6,
    layout: null,
    ...overrides,
  };
}

export function makeRawContentModule(
  overrides: Partial<TRawContentModule> = {},
): TRawContentModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    body: [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'span-1', text: 'Hello.' }],
      },
    ],
    layout: null,
    ...overrides,
  };
}

export function makeRawCtaModule(
  overrides: Partial<TRawCtaModule> = {},
): TRawCtaModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Subscribe to the newsletter',
      supportingText: 'Get new posts in your inbox.',
      align: null,
    },
    action: {
      label: 'Subscribe',
      linkType: TLINK_TYPE.EXTERNAL,
      url: '/newsletter',
      internalReference: null,
      openInNewTab: null,
      platform: null,
      accessibleLabel: null,
    },
    layout: null,
    ...overrides,
  };
}

export function makeRawTaxonomyListModule(
  overrides: Partial<TRawTaxonomyListModule> = {},
): TRawTaxonomyListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: { heading: 'Topics', supportingText: null, align: null },
    layout: null,
    ...overrides,
  };
}

export function makeRawNewsletterModule(
  overrides: Partial<TRawNewsletterModule> = {},
): TRawNewsletterModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Stay in the loop',
      supportingText: 'Get new posts in your inbox.',
      align: null,
    },
    layout: null,
    ...overrides,
  };
}
