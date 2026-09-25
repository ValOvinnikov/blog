import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  CTA_VARIANT,
  DISPLAY_MODE,
  HERO_FIELD_MODE,
  HERO_VARIANT,
  LINK_TYPE,
  MEDIA_ORDER,
  NEWSLETTER_VARIANT,
  POST_SOURCE,
  TAXONOMY_KIND,
  TAXONOMY_SORT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import type { TRawContentModule } from '@blog/service/features/modules/content/adaptor/transformer';
import type { TRawCtaModule } from '@blog/service/features/modules/cta/adaptor/transformer';
import type { TRawFaqModule } from '@blog/service/features/modules/faq/adaptor/transformer';
import type { TRawFeatureHighlightsModule } from '@blog/service/features/modules/feature-highlights/adaptor/transformer';
import type { TRawFeatureListModule } from '@blog/service/features/modules/feature-list/adaptor/transformer';
import type { TRawHeroModule } from '@blog/service/features/modules/hero/adaptor/transformer';
import type { TRawHeroBlogModule } from '@blog/service/features/modules/hero-blog/adaptor/transformer';
import type { TRawHeroProfileModule } from '@blog/service/features/modules/hero-profile/adaptor/transformer';
import type { TRawHeroStatementModule } from '@blog/service/features/modules/hero-statement/adaptor/transformer';
import type { TRawLogoWallModule } from '@blog/service/features/modules/logo-wall/adaptor/transformer';
import type { TRawNewsletterModule } from '@blog/service/features/modules/newsletter/adaptor/transformer';
import type { TRawPostFeaturedModule } from '@blog/service/features/modules/post-featured/adaptor/transformer';
import type { TRawPostLatestModule } from '@blog/service/features/modules/post-latest/adaptor/transformer';
import type { TRawPostListModule } from '@blog/service/features/modules/post-list/adaptor/transformer';
import type { TRawPostRelatedModule } from '@blog/service/features/modules/post-related/adaptor/transformer';
import type { TRawStatsModule } from '@blog/service/features/modules/stats/adaptor/transformer';
import type { TRawTaxonomyListModule } from '@blog/service/features/modules/taxonomy-list/adaptor/transformer';
import type { TRawTestimonialModule } from '@blog/service/features/modules/testimonial/adaptor/transformer';
import type { TRawTimelineModule } from '@blog/service/features/modules/timeline/adaptor/transformer';
import type { TRawCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import {
  makeRawHeadingBlock,
  makeRawPortableTextMarkDef,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

type TRawCtaContentBlock = NonNullable<TRawCtaModule['content']>[number];
type TRawCtaContentMarkDef = NonNullable<
  TRawCtaContentBlock['markDefs']
>[number];
type TRawFeatureListItem = NonNullable<
  TRawFeatureListModule['features']
>[number];
type TRawTaxonomyEntry = NonNullable<TRawTaxonomyListModule['entries']>[number];
type TRawLogoItem = NonNullable<TRawLogoWallModule['logos']>[number];
type TRawFeatureHighlightItem = NonNullable<
  TRawFeatureHighlightsModule['highlights']
>[number];
type TRawStatItem = NonNullable<TRawStatsModule['stats']>[number];
type TRawTestimonialItem = NonNullable<
  TRawTestimonialModule['testimonials']
>[number];
type TRawFaqQuestionItem = TRawFaqModule['questions'][number];
type TRawTimelineItem = NonNullable<TRawTimelineModule['items']>[number];

export function makeRawHeroModule(
  overrides: Partial<TRawHeroModule> = {},
): TRawHeroModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    featuredPost: null,
    heroEyebrowMode: HERO_FIELD_MODE.POST_TOPIC,
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

export function makeRawHeroBlogModule(
  overrides: Partial<TRawHeroBlogModule> = {},
): TRawHeroBlogModule {
  return {
    post: null,
    eyebrow: null,
    image: null,
    primaryActionLabel: 'Read the post',
    primaryActionAppearance: CTA_ACTION_APPEARANCE.CONTAINED,
    secondaryAction: null,
    variant: HERO_VARIANT.SPLIT,
    brandVariant: BRAND_VARIANT.PRIMARY,
    contentPositionSplit: null,
    contentPositionBanner: null,
    contentAlignment: null,
    mediaOrderSplit: null,
    mediaOrderStacked: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawHeroStatementModule(
  overrides: Partial<TRawHeroStatementModule> = {},
): TRawHeroStatementModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    variant: HERO_VARIANT.SPLIT,
    eyebrow: null,
    headingBlock: makeRawHeadingBlock('Statement heading'),
    image: null,
    ctaButtons: null,
    contentPositionSplit: null,
    contentPositionBanner: null,
    contentAlignment: null,
    mediaOrderSplit: null,
    mediaOrderStacked: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawHeroProfileModule(
  overrides: Partial<TRawHeroProfileModule> = {},
): TRawHeroProfileModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    variant: HERO_VARIANT.SPLIT,
    eyebrow: null,
    headingBlock: makeRawHeadingBlock('Profile heading'),
    image: null,
    showSocialLinks: true,
    showRole: true,
    showBio: true,
    author: {
      _id: 'author-1',
      name: 'Jamie Rivera',
      image: null,
      profilePage: null,
      role: null,
      bio: null,
      socialLinks: null,
    },
    ctaButtons: null,
    contentPositionSplit: null,
    contentPositionBanner: null,
    contentAlignment: null,
    mediaOrderSplit: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawPostListModule(
  overrides: Partial<TRawPostListModule> = {},
): TRawPostListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Latest'),
    pageSize: 6,
    layout: null,
    contentAlignment: null,
    showImages: true,
    ...overrides,
  };
}

export function makeRawPostLatestModule(
  overrides: Partial<TRawPostLatestModule> = {},
): TRawPostLatestModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Latest'),
    limit: 6,
    layout: null,
    contentAlignment: null,
    showImages: true,
    displayMode: DISPLAY_MODE.GRID,
    ...overrides,
  };
}

export function makeRawPostFeaturedModule(
  overrides: Partial<TRawPostFeaturedModule> = {},
): TRawPostFeaturedModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Featured'),
    postSource: POST_SOURCE.PINNED,
    posts: [],
    limit: null,
    layout: null,
    contentAlignment: null,
    showImages: true,
    displayMode: DISPLAY_MODE.GRID,
    ...overrides,
  };
}

export function makeRawPostRelatedModule(
  overrides: Partial<TRawPostRelatedModule> = {},
): TRawPostRelatedModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Related reading'),
    limit: 3,
    layout: null,
    contentAlignment: null,
    showImages: true,
    ...overrides,
  };
}

export function makeRawContentModule(
  overrides: Partial<TRawContentModule> = {},
): TRawContentModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    body: [makeRawContentBlock()],
    layout: null,
    ...overrides,
  };
}

export function makeRawCtaModule(
  overrides: Partial<TRawCtaModule> = {},
): TRawCtaModule {
  return {
    variant: CTA_VARIANT.CALLOUT,
    brandVariant: BRAND_VARIANT.PRIMARY,
    bandTone: BRAND_VARIANT.PRIMARY,
    eyebrow: null,
    headingBlock: makeRawHeadingBlock('Subscribe to the newsletter', {
      supportingText: 'Get new posts in your inbox.',
    }),
    content: null,
    image: null,
    contentPositionSplit: null,
    contentPositionBanner: null,
    contentAlignment: null,
    mobileMediaOrder: null,
    ctaButtons: null,
    footnote: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawCtaButton(
  overrides: Partial<TRawCtaButton> = {},
): TRawCtaButton {
  return {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: CTA_ACTION_APPEARANCE.CONTAINED,
    link: {
      label: 'Subscribe',
      linkType: LINK_TYPE.EXTERNAL,
      url: '/newsletter',
      internalReference: null,
      openInNewTab: null,
    },
    ...overrides,
  };
}

export function makeRawContentMarkDef(
  overrides: Partial<TRawCtaContentMarkDef> = {},
): TRawCtaContentMarkDef {
  return makeRawPortableTextMarkDef(overrides);
}

export function makeRawContentBlock(
  overrides: Partial<TRawCtaContentBlock> & { text?: string } = {},
): TRawCtaContentBlock {
  const { text = 'Hi.', ...rest } = overrides;

  return {
    _type: 'block',
    _key: 'block-1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'span-1', text }],
    markDefs: null,
    ...rest,
  };
}

export function makeRawTaxonomyListModule(
  overrides: Partial<TRawTaxonomyListModule> = {},
): TRawTaxonomyListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Topics'),
    layout: null,
    contentAlignment: null,
    taxonomy: TAXONOMY_KIND.TOPICS,
    sortOrder: TAXONOMY_SORT.ALPHABETICAL,
    limit: null,
    showLatestPosts: true,
    entries: [],
    ...overrides,
  };
}

export function makeRawTaxonomyEntry(
  overrides: Partial<TRawTaxonomyEntry> = {},
): TRawTaxonomyEntry {
  return {
    _id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
    description: 'Engineering posts',
    postCount: 0,
    latestPosts: [],
    ...overrides,
  };
}

export function makeRawNewsletterModule(
  overrides: Partial<TRawNewsletterModule> = {},
): TRawNewsletterModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Stay in the loop', {
      supportingText: 'Get new posts in your inbox.',
    }),
    variant: NEWSLETTER_VARIANT.FULL,
    layout: null,
    contentAlignment: null,
    ...overrides,
  };
}

export function makeRawFeatureListItem(
  overrides: Partial<TRawFeatureListItem> = {},
): TRawFeatureListItem {
  return {
    _id: 'block-feature-1',
    headingBlock: makeRawHeadingBlock('Ship faster'),
    icon: 'ROCKET',
    image: null,
    link: null,
    ...overrides,
  };
}

export function makeRawFeatureListModule(
  overrides: Partial<TRawFeatureListModule> = {},
): TRawFeatureListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Features'),
    features: [
      makeRawFeatureListItem(),
      makeRawFeatureListItem({ _id: 'block-feature-2' }),
    ],
    ctaButtons: null,
    imageShape: CARD_IMAGE_SHAPE.WIDE,
    displayMode: DISPLAY_MODE.GRID,
    contentAlignment: null,
    cardAlignment: CONTENT_ALIGNMENT.LEFT,
    layout: null,
    ...overrides,
  };
}

function makeRawLogoImage(): TRawLogoItem['image'] {
  const { asset, hotspot, crop } = makeRawSanityImage();

  return { asset, hotspot, crop };
}

export function makeRawLogoItem(
  overrides: Partial<TRawLogoItem> = {},
): TRawLogoItem {
  return {
    _key: 'block-logo-1',
    name: 'Acme Corp',
    image: makeRawLogoImage(),
    link: null,
    ...overrides,
  };
}

export function makeRawTestimonialItem(
  overrides: Partial<TRawTestimonialItem> = {},
): TRawTestimonialItem {
  return {
    _id: 'block-testimonial-1',
    name: 'Jamie Rivera',
    quote: [makeRawContentBlock({ text: 'Great work.' })],
    role: null,
    image: null,
    link: null,
    ...overrides,
  };
}

export function makeRawLogoWallModule(
  overrides: Partial<TRawLogoWallModule> = {},
): TRawLogoWallModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Trusted by'),
    logos: [
      makeRawLogoItem(),
      makeRawLogoItem({ _key: 'block-logo-2' }),
      makeRawLogoItem({ _key: 'block-logo-3' }),
    ],
    ctaButtons: null,
    displayMode: DISPLAY_MODE.GRID,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawFeatureHighlightItem(
  overrides: Partial<TRawFeatureHighlightItem> = {},
): TRawFeatureHighlightItem {
  return {
    _key: 'block-highlight-1',
    heading: 'Ship faster',
    body: [makeRawContentBlock({ text: 'Ship faster with less friction.' })],
    image: makeRawSanityImage(),
    action: null,
    ...overrides,
  };
}

export function makeRawFeatureHighlightsModule(
  overrides: Partial<TRawFeatureHighlightsModule> = {},
): TRawFeatureHighlightsModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Why teams choose us'),
    highlights: [
      makeRawFeatureHighlightItem(),
      makeRawFeatureHighlightItem({ _key: 'block-highlight-2' }),
    ],
    ctaButtons: null,
    mediaOrder: MEDIA_ORDER.FIRST,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawStatItem(
  overrides: Partial<TRawStatItem> = {},
): TRawStatItem {
  return {
    _key: 'stat-1',
    value: '2.4M',
    label: 'Monthly readers',
    description: null,
    ...overrides,
  };
}

export function makeRawStatsModule(
  overrides: Partial<TRawStatsModule> = {},
): TRawStatsModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('By the numbers'),
    stats: [
      makeRawStatItem(),
      makeRawStatItem({
        _key: 'stat-2',
        value: '128',
        label: 'Countries reached',
      }),
    ],
    footnote: null,
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawTestimonialModule(
  overrides: Partial<TRawTestimonialModule> = {},
): TRawTestimonialModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('What people say'),
    testimonials: [
      makeRawTestimonialItem(),
      makeRawTestimonialItem({ _id: 'block-testimonial-2' }),
    ],
    ctaButtons: null,
    displayMode: DISPLAY_MODE.GRID,
    cardAlignment: null,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawFaqQuestionItem(
  overrides: Partial<TRawFaqQuestionItem> = {},
): TRawFaqQuestionItem {
  return {
    _id: 'block-faq-1',
    question: 'How long does onboarding take?',
    answer: [
      makeRawContentBlock({ text: 'Most teams are live within a week.' }),
    ],
    ...overrides,
  };
}

export function makeRawFaqModule(
  overrides: Partial<TRawFaqModule> = {},
): TRawFaqModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('Frequently asked questions'),
    questions: [
      makeRawFaqQuestionItem(),
      makeRawFaqQuestionItem({ _id: 'block-faq-2' }),
    ],
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawTimelineItem(
  overrides: Partial<TRawTimelineItem> = {},
): TRawTimelineItem {
  return {
    _key: 'block-timeline-1',
    marker: null,
    heading: 'Kick off',
    body: [
      {
        _type: 'block',
        _key: 'timeline-body-1',
        children: [
          {
            _type: 'span',
            _key: 'timeline-body-1-span',
            text: 'The project begins.',
          },
        ],
        markDefs: null,
      },
    ],
    ...overrides,
  };
}

export function makeRawTimelineModule(
  overrides: Partial<TRawTimelineModule> = {},
): TRawTimelineModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRawHeadingBlock('How it works'),
    markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
    items: [
      makeRawTimelineItem(),
      makeRawTimelineItem({
        _key: 'block-timeline-2',
        heading: 'Ship',
        body: null,
      }),
    ],
    orientation: TIMELINE_ORIENTATION.VERTICAL,
    ctaButtons: null,
    contentAlignment: null,
    itemAlignment: CONTENT_ALIGNMENT.LEFT,
    layout: null,
    ...overrides,
  };
}
