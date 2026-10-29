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
  ICONS,
  LINK_TYPE,
  LOCALE_ISO_CODES,
  MEDIA_ORDER,
  NEWSLETTER_VARIANT,
  POST_SOURCE,
  PRICE_PERIOD,
  TAXONOMY_KIND,
  TAXONOMY_SORT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import type { TRawContactFormModule } from '@blog/service/features/modules/contact-form/adaptor/transformer';
import type { TRawContentModule } from '@blog/service/features/modules/content/adaptor/transformer';
import type { TRawCookieSettingsModule } from '@blog/service/features/modules/cookie-settings/adaptor/transformer';
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
import type { TRawPostRelatedModule } from '@blog/service/features/modules/post-related/adaptor/module/transformer';
import type { TRawPricingModule } from '@blog/service/features/modules/pricing/adaptor/transformer';
import type { TRawSectionPagesModule } from '@blog/service/features/modules/section-pages/adaptor/module/transformer';
import type { TRawSectionPages } from '@blog/service/features/modules/section-pages/adaptor/pages/transformer';
import type { TRawStatsModule } from '@blog/service/features/modules/stats/adaptor/transformer';
import type { TRawTaxonomyListModule } from '@blog/service/features/modules/taxonomy-list/adaptor/transformer';
import type { TRawTeamModule } from '@blog/service/features/modules/team/adaptor/transformer';
import type { TRawTestimonialModule } from '@blog/service/features/modules/testimonial/adaptor/transformer';
import type { TRawTimelineModule } from '@blog/service/features/modules/timeline/adaptor/transformer';
import type { TFaqModuleQuestions } from '@blog/service/shared/adaptors/faq-questions/types';
import type {
  TCtaButton,
  TRawCtaButton,
} from '@blog/service/shared/transformers/cta/to-cta-button';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';
import {
  MOCK_AUTHOR_ID,
  MOCK_TOPIC_DESCRIPTION,
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
} from '@blog/service/testing/entities/fixtures';
import {
  mockLinkView,
  mockRawHeadingBlock,
  mockRawParagraphTextBlock,
  mockRawPortableTextMarkDef,
  mockRawSanityImage,
} from '@blog/service/testing/shared/fixtures';
import { mockLocalizedHeadingBlock } from '@blog/service/testing/shared/localized';

export const MOCK_MODULE_ID = 'module-1';
export const MOCK_HERO_EYEBROW = 'Field notes';
export const MOCK_HERO_IMAGE_ALT = 'Custom alt';
export const MOCK_FEATURED_POST_ID = 'featured-ref';
export const MOCK_CONTENT_MODULE_ID = 'content-1';
export const MOCK_COOKIE_SETTINGS_MODULE_ID = 'cookie-settings-1';
export const MOCK_CTA_MODULE_ID = 'cta-1';
export const MOCK_FAQ_MODULE_ID = 'faq-1';
export const MOCK_FEATURE_LIST_MODULE_ID = 'feature-list-1';
export const MOCK_NEWSLETTER_MODULE_ID = 'newsletter-1';
export const MOCK_POST_RELATED_MODULE_ID = 'post-related-1';
export const MOCK_PRICING_MODULE_ID = 'pricing-1';
export const MOCK_SECTION_PAGES_MODULE_ID = 'section-pages-1';
export const MOCK_SECTION_PAGES_PARENT_ID = 'page-modules';
export const MOCK_SECTION_PAGES_PARENT_PATH = 'section-home';
export const MOCK_STATS_MODULE_ID = 'stats-1';
export const MOCK_TAXONOMY_LIST_MODULE_ID = 'taxonomy-list-1';
export const MOCK_TESTIMONIAL_MODULE_ID = 'testimonial-1';
export const MOCK_TIMELINE_MODULE_ID = 'timeline-1';
export const MOCK_ENGLISH_MODULE_HEADING = 'Latest posts';
export const MOCK_DUTCH_MODULE_HEADING = 'Nieuwste berichten';
const CTA_BUTTON_LABEL = 'Subscribe';
export const MOCK_CTA_BUTTON_URL = '/newsletter';
export const MOCK_FAQ_QUESTION_ID = 'block-faq-1';
export const MOCK_SECOND_FAQ_QUESTION_ID = 'block-faq-2';
export const MOCK_SECTION_PAGES_HEADING = 'In this section';
export const MOCK_COOKIE_SETTINGS_HEADING = 'Your cookie choices';
const MOCK_NEWSLETTER_HEADING = 'Stay in the loop';
export const MOCK_RECENT_POSTS_HEADING = 'Recent writing';
export const MOCK_POST_LIST_PAGE_SIZE = 9;
export const MOCK_UNLIMITED_POSTS_FEATURE = 'Unlimited posts';
export const MOCK_PRIORITY_SUPPORT_FEATURE = 'Priority support';
export const MOCK_PRICING_FEATURE_KEY = 'feature-1';
export const MOCK_SECOND_PRICING_FEATURE_KEY = 'feature-2';
export const MOCK_PRICING_FOOTNOTE = 'Prices exclude VAT.';
export const MOCK_PRICING_HIGHLIGHT_LABEL = 'Most popular';
export const MOCK_PRICING_TIER_DESCRIPTION = 'For growing teams';
export const MOCK_PRICING_TIER_FOOTNOTE = 'Billed annually';
export const MOCK_PRICING_TIER_ID = 'tier-pro';
export const MOCK_PRICING_TIER_NAME = 'Pro';

const FAQ_QUESTION = 'How long does onboarding take?';
const FAQ_ANSWER = 'Most teams are live within a week.';
const PERSON_NAME = 'Jamie Rivera';
const INBOX_SUPPORTING_TEXT = 'Get new posts in your inbox.';
const SHIP_FASTER = 'Ship faster';

export function mockModuleDocument(
  fields: { _type: string } & Record<string, unknown>,
) {
  return {
    _id: MOCK_MODULE_ID,
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockLocalizedHeadingBlock({
      [LOCALE_ISO_CODES.EN]: MOCK_ENGLISH_MODULE_HEADING,
      [LOCALE_ISO_CODES.NL]: MOCK_DUTCH_MODULE_HEADING,
    }),
    ...fields,
  };
}

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
type TRawPricingTier = NonNullable<TRawPricingModule['tiers']>[number];
type TRawPricingPrice = NonNullable<TRawPricingTier['prices']>[number];
type TRawTestimonialItem = NonNullable<
  TRawTestimonialModule['testimonials']
>[number];
type TRawTeamMember = TRawTeamModule['members'][number];
type TRawFaqQuestionItem = TRawFaqModule['questions'][number];
type TRawTimelineItem = NonNullable<TRawTimelineModule['items']>[number];
type TRawTimelineItemBody = NonNullable<TRawTimelineItem['body']>[number];

export function mockRawHeroModule(
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

export function mockRawHeroBlogModule(
  overrides: Partial<TRawHeroBlogModule> = {},
): TRawHeroBlogModule {
  return {
    post: null,
    hasPinnedPost: false,
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

export function mockRawHeroStatementModule(
  overrides: Partial<TRawHeroStatementModule> = {},
): TRawHeroStatementModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    variant: HERO_VARIANT.SPLIT,
    eyebrow: null,
    headingBlock: mockRawHeadingBlock('Statement heading'),
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

export function mockRawHeroProfileModule(
  overrides: Partial<TRawHeroProfileModule> = {},
): TRawHeroProfileModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    variant: HERO_VARIANT.SPLIT,
    eyebrow: null,
    headingBlock: mockRawHeadingBlock('Profile heading'),
    image: null,
    showSocialLinks: true,
    showRole: true,
    showBio: true,
    author: {
      _id: MOCK_AUTHOR_ID,
      name: PERSON_NAME,
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

export function mockRawPostListModule(
  overrides: Partial<TRawPostListModule> = {},
): TRawPostListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Latest'),
    pageSize: 6,
    layout: null,
    contentAlignment: null,
    showImages: true,
    ...overrides,
  };
}

export function mockRawPostLatestModule(
  overrides: Partial<TRawPostLatestModule> = {},
): TRawPostLatestModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Latest'),
    limit: 6,
    layout: null,
    contentAlignment: null,
    showImages: true,
    displayMode: DISPLAY_MODE.GRID,
    ...overrides,
  };
}

export function mockRawPostFeaturedModule(
  overrides: Partial<TRawPostFeaturedModule> = {},
): TRawPostFeaturedModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Featured'),
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

export function mockRawSectionPagesModule(
  overrides: Partial<TRawSectionPagesModule> = {},
): TRawSectionPagesModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock(MOCK_SECTION_PAGES_HEADING),
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function mockRawSectionPage(
  overrides: Partial<TRawSectionPages[number]> = {},
): TRawSectionPages[number] {
  return {
    _id: 'page-faq',
    slug: 'faq',
    headingBlock: mockRawHeadingBlock('FAQ', {
      supportingText: 'Answers to common questions.',
    }),
    image: mockRawSanityImage(),
    ...overrides,
  };
}

export function mockRawPostRelatedModule(
  overrides: Partial<TRawPostRelatedModule> = {},
): TRawPostRelatedModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Related reading'),
    limit: 3,
    layout: null,
    contentAlignment: null,
    showImages: true,
    ...overrides,
  };
}

export function mockRawContentModule(
  overrides: Partial<TRawContentModule> = {},
): TRawContentModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    body: [mockRawContentBlock()],
    layout: null,
    ...overrides,
  };
}

export function mockRawCtaModule(
  overrides: Partial<TRawCtaModule> = {},
): TRawCtaModule {
  return {
    variant: CTA_VARIANT.CALLOUT,
    brandVariant: BRAND_VARIANT.PRIMARY,
    bandTone: BRAND_VARIANT.PRIMARY,
    eyebrow: null,
    headingBlock: mockRawHeadingBlock('Subscribe to the newsletter', {
      supportingText: INBOX_SUPPORTING_TEXT,
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

export function mockRawCtaButton(
  overrides: Partial<TRawCtaButton> = {},
): TRawCtaButton {
  return {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: CTA_ACTION_APPEARANCE.CONTAINED,
    link: {
      label: CTA_BUTTON_LABEL,
      linkType: LINK_TYPE.EXTERNAL,
      url: MOCK_CTA_BUTTON_URL,
      internalReference: null,
      openInNewTab: null,
    },
    ...overrides,
  };
}

export function mockCtaButtonView(
  overrides: Partial<TCtaButton> = {},
): TCtaButton {
  return {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: CTA_ACTION_APPEARANCE.CONTAINED,
    link: mockLinkView({
      label: CTA_BUTTON_LABEL,
      href: MOCK_CTA_BUTTON_URL,
    }),
    ...overrides,
  };
}

export function mockRawContentMarkDef(
  overrides: Partial<TRawCtaContentMarkDef> = {},
): TRawCtaContentMarkDef {
  return mockRawPortableTextMarkDef(overrides);
}

export function mockRawContentBlock(
  overrides: Partial<TRawCtaContentBlock> & { text?: string } = {},
): TRawCtaContentBlock {
  return mockRawParagraphTextBlock<TRawCtaContentBlock>(overrides);
}

export function mockRawTaxonomyListModule(
  overrides: Partial<TRawTaxonomyListModule> = {},
): TRawTaxonomyListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Topics'),
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

export function mockRawTaxonomyEntry(
  overrides: Partial<TRawTaxonomyEntry> = {},
): TRawTaxonomyEntry {
  return {
    _id: MOCK_TOPIC_ID,
    title: MOCK_TOPIC_TITLE,
    slug: MOCK_TOPIC_SLUG,
    description: MOCK_TOPIC_DESCRIPTION,
    postCount: 0,
    latestPosts: [],
    ...overrides,
  };
}

export function mockRawNewsletterModule(
  overrides: Partial<TRawNewsletterModule> = {},
): TRawNewsletterModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock(MOCK_NEWSLETTER_HEADING, {
      supportingText: INBOX_SUPPORTING_TEXT,
    }),
    content: null,
    variant: NEWSLETTER_VARIANT.FULL,
    trustCues: null,
    layout: null,
    contentAlignment: null,
    ...overrides,
  };
}

export function mockRawContactFormModule(
  overrides: Partial<TRawContactFormModule> = {},
): TRawContactFormModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Get in touch', {
      supportingText: 'Questions, ideas or work enquiries.',
    }),
    successMessage: "Thanks — I'll reply within two days.",
    privacyNote: null,
    layout: null,
    contentAlignment: null,
    ...overrides,
  };
}

export function mockRawCookieSettingsModule(
  overrides: Partial<TRawCookieSettingsModule> = {},
): TRawCookieSettingsModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock(MOCK_COOKIE_SETTINGS_HEADING),
    layout: null,
    ...overrides,
  };
}

export function mockRawFeatureListItem(
  overrides: Partial<TRawFeatureListItem> = {},
): TRawFeatureListItem {
  return {
    _id: 'block-feature-1',
    headingBlock: mockRawHeadingBlock(SHIP_FASTER),
    icon: ICONS.ROCKET,
    image: null,
    link: null,
    ...overrides,
  };
}

export function mockRawFeatureListModule(
  overrides: Partial<TRawFeatureListModule> = {},
): TRawFeatureListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Features'),
    features: [
      mockRawFeatureListItem(),
      mockRawFeatureListItem({ _id: 'block-feature-2' }),
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

export function mockRawLogoImage(): TRawLogoItem['image'] {
  const { asset, hotspot, crop } = mockRawSanityImage();

  return { asset, hotspot, crop };
}

export function mockRawLogoItem(
  overrides: Partial<TRawLogoItem> = {},
): TRawLogoItem {
  return {
    _key: 'block-logo-1',
    name: 'Acme Corp',
    image: mockRawLogoImage(),
    imageDark: null,
    link: null,
    ...overrides,
  };
}

export function mockRawPricingPrice(
  overrides: Partial<TRawPricingPrice> = {},
): TRawPricingPrice {
  return {
    _key: 'price-1',
    period: PRICE_PERIOD.MONTH,
    amount: 29,
    compareAtAmount: null,
    isStartingAt: null,
    ...overrides,
  };
}

export function mockRawPricingTier(
  overrides: Partial<TRawPricingTier> = {},
): TRawPricingTier {
  return {
    _key: 'tier-1',
    name: MOCK_PRICING_TIER_NAME,
    description: null,
    prices: [mockRawPricingPrice()],
    priceLabel: null,
    features: [
      { _key: MOCK_PRICING_FEATURE_KEY, text: MOCK_UNLIMITED_POSTS_FEATURE },
      {
        _key: MOCK_SECOND_PRICING_FEATURE_KEY,
        text: MOCK_PRIORITY_SUPPORT_FEATURE,
      },
    ],
    ctaButtons: null,
    highlightLabel: null,
    footnote: null,
    ...overrides,
  };
}

export function mockRawPricingModule(
  overrides: Partial<TRawPricingModule> = {},
): TRawPricingModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Pricing'),
    tiers: [
      mockRawPricingTier(),
      mockRawPricingTier({ _key: 'tier-2', name: 'Team' }),
    ],
    footnote: null,
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function mockRawTestimonialItem(
  overrides: Partial<TRawTestimonialItem> = {},
): TRawTestimonialItem {
  return {
    _id: 'block-testimonial-1',
    name: PERSON_NAME,
    quote: [mockRawContentBlock({ text: 'Great work.' })],
    role: null,
    image: null,
    link: null,
    ...overrides,
  };
}

export function mockRawLogoWallModule(
  overrides: Partial<TRawLogoWallModule> = {},
): TRawLogoWallModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Trusted by'),
    logos: [
      mockRawLogoItem(),
      mockRawLogoItem({ _key: 'block-logo-2' }),
      mockRawLogoItem({ _key: 'block-logo-3' }),
    ],
    ctaButtons: null,
    displayMode: DISPLAY_MODE.GRID,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function mockRawFeatureHighlightItem(
  overrides: Partial<TRawFeatureHighlightItem> = {},
): TRawFeatureHighlightItem {
  return {
    _key: 'block-highlight-1',
    heading: SHIP_FASTER,
    body: [mockRawContentBlock({ text: 'Ship faster with less friction.' })],
    image: mockRawSanityImage(),
    action: null,
    ...overrides,
  };
}

export function mockRawFeatureHighlightsModule(
  overrides: Partial<TRawFeatureHighlightsModule> = {},
): TRawFeatureHighlightsModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Why teams choose us'),
    highlights: [
      mockRawFeatureHighlightItem(),
      mockRawFeatureHighlightItem({ _key: 'block-highlight-2' }),
    ],
    ctaButtons: null,
    mediaOrder: MEDIA_ORDER.FIRST,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function mockRawStatItem(
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

export function mockRawStatsModule(
  overrides: Partial<TRawStatsModule> = {},
): TRawStatsModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('By the numbers'),
    stats: [
      mockRawStatItem(),
      mockRawStatItem({
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

export function mockRawTestimonialModule(
  overrides: Partial<TRawTestimonialModule> = {},
): TRawTestimonialModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('What people say'),
    testimonials: [
      mockRawTestimonialItem(),
      mockRawTestimonialItem({ _id: 'block-testimonial-2' }),
    ],
    ctaButtons: null,
    displayMode: DISPLAY_MODE.GRID,
    cardAlignment: CONTENT_ALIGNMENT.LEFT,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function mockRawTeamMember(
  overrides: Partial<TRawTeamMember> = {},
): TRawTeamMember {
  return {
    _id: 'person-1',
    name: PERSON_NAME,
    image: null,
    profilePage: null,
    role: null,
    bio: null,
    socialLinks: null,
    ...overrides,
  };
}

export function mockRawTeamModule(
  overrides: Partial<TRawTeamModule> = {},
): TRawTeamModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Meet the team'),
    members: [
      mockRawTeamMember(),
      mockRawTeamMember({ _id: 'person-2', name: 'Alex Chen' }),
    ],
    showBios: false,
    showSocialLinks: true,
    imageShape: CARD_IMAGE_SHAPE.CIRCLE,
    displayMode: DISPLAY_MODE.GRID,
    cardAlignment: CONTENT_ALIGNMENT.CENTER,
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function mockRawFaqQuestionItem(
  overrides: Partial<TRawFaqQuestionItem> = {},
): TRawFaqQuestionItem {
  return {
    _id: MOCK_FAQ_QUESTION_ID,
    question: FAQ_QUESTION,
    answer: [mockRawContentBlock({ text: FAQ_ANSWER })],
    ...overrides,
  };
}

export function mockFaqView(): TFaqPageQuestion {
  return {
    id: MOCK_FAQ_QUESTION_ID,
    question: FAQ_QUESTION,
    answer: FAQ_ANSWER,
  };
}

export function mockRawFaqModuleQuestions(
  overrides: Partial<TFaqModuleQuestions> = {},
): TFaqModuleQuestions {
  return {
    _id: 'module-faq-1',
    questions: [mockRawFaqQuestionItem()],
    ...overrides,
  };
}

export function mockRawFaqModule(
  overrides: Partial<TRawFaqModule> = {},
): TRawFaqModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Frequently asked questions'),
    questions: [
      mockRawFaqQuestionItem(),
      mockRawFaqQuestionItem({ _id: MOCK_SECOND_FAQ_QUESTION_ID }),
    ],
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}

export function mockRawTimelineItem(
  overrides: Partial<TRawTimelineItem> = {},
): TRawTimelineItem {
  return {
    _key: 'block-timeline-1',
    marker: null,
    heading: 'Kick off',
    body: [
      mockRawParagraphTextBlock<TRawTimelineItemBody>({
        _key: 'timeline-body-1',
        text: 'The project begins.',
      }),
    ],
    ...overrides,
  };
}

export function mockRawTimelineModule(
  overrides: Partial<TRawTimelineModule> = {},
): TRawTimelineModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('How it works'),
    markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
    items: [
      mockRawTimelineItem(),
      mockRawTimelineItem({
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
