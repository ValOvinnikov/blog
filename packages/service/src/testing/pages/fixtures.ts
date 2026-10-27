import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { TRawHomePage } from '@blog/service/features/pages/home/adaptor/transformer';
import type { TRawLandingPage } from '@blog/service/features/pages/landing/adaptor/detail-page/transformer';
import type { TRawPostDetail } from '@blog/service/features/pages/post/adaptor/detail-page/transformer';
import type { TRawBlogPage } from '@blog/service/features/pages/post-index/adaptor/index-page/transformer';
import type { TRawTagPage } from '@blog/service/features/pages/tag/adaptor/detail-page/transformer';
import type { TRawTagIndexPage } from '@blog/service/features/pages/tag-index/adaptor/transformer';
import type { TRawTopicPage } from '@blog/service/features/pages/topic/adaptor/detail-page/transformer';
import type { TRawTopicIndexPage } from '@blog/service/features/pages/topic-index/adaptor/transformer';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TRawPersonCard } from '@blog/service/shared/transformers/person/to-person-card';
import type { TRawPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import {
  MOCK_AUTHOR_AVATAR_ALT,
  MOCK_AUTHOR_ID,
  MOCK_AUTHOR_NAME,
  MOCK_TAG_SLUG,
  MOCK_TAG_TITLE,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
  mockRawTag,
  mockRawTopic,
} from '@blog/service/testing/entities/fixtures';
import {
  MOCK_CONTENT_MODULE_ID,
  MOCK_CTA_MODULE_ID,
  MOCK_POST_LIST_PAGE_SIZE,
  MOCK_TAXONOMY_LIST_MODULE_ID,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_POST_EXCERPT,
  MOCK_POST_ID,
  MOCK_POST_PUBLISHED_AT,
  MOCK_POST_SLUG,
  MOCK_POST_TITLE,
  mockRawHeadingBlock,
  mockRawSanityImage,
  mockRawSeo,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { mockTranslationLink } from '@blog/service/testing/shared/localized';
import { MOCK_ABOUT_SLUG } from '@blog/service/testing/shared/translated-pages-dataset';
import { faker } from '@faker-js/faker';

export const MOCK_HOME_PAGE_ID = 'home-1';
export const MOCK_LIST_MODULE_ID = 'list-1';
export const MOCK_HERO_MODULE_ID = 'hero-1';
export const MOCK_POST_LATEST_MODULE_ID = 'post-latest-1';
export const MOCK_TOPIC_INDEX_HEADING = 'Browse by topic';
export const MOCK_TAG_INDEX_HEADING = 'Browse by tag';
export const MOCK_TAG_PAGE_DESCRIPTION = 'Posts about TypeScript.';
export const MOCK_ABOUT_PAGE_TITLE = 'About Us';
export const MOCK_CURATED_SUPPORTING_TEXT = 'Hand-picked reads.';
export const MOCK_TEMPLATE_REFERENCE = mockReference('template-a');

const POST_LIST_MODULE_ID = 'post-list-1';

export function mockRawAuthor(
  overrides: Partial<TRawPostDetail['author']> = {},
): TRawPostDetail['author'] {
  return {
    _id: MOCK_AUTHOR_ID,
    name: MOCK_AUTHOR_NAME,
    image: mockRawSanityImage(MOCK_AUTHOR_AVATAR_ALT),
    profilePage: null,
    role: 'Writer',
    bio: null,
    socialLinks: null,
    ...overrides,
  };
}

export function mockRawPersonCard(
  overrides: Partial<TRawPersonCard> = {},
): TRawPersonCard {
  const { _id, name } = mockRawAuthor();

  return { _id, name, image: null, profilePage: null, ...overrides };
}

export function mockRawHeroRef() {
  return { _id: MOCK_HERO_MODULE_ID, _type: 'module_heroBlog' } as const;
}

export function mockHeroSlotView() {
  return { id: MOCK_HERO_MODULE_ID, type: 'module_heroBlog' };
}

export function mockRawTaxonomyListRef() {
  return {
    _id: MOCK_TAXONOMY_LIST_MODULE_ID,
    _type: 'module_taxonomyList',
  } as const;
}

export function mockTaxonomyListSlotView(): TModule {
  const { _id: id, _type: type } = mockRawTaxonomyListRef();

  return { id, type };
}

export function mockRawCtaRef() {
  return { _id: MOCK_CTA_MODULE_ID, _type: 'module_cta' } as const;
}

export function mockCtaSlotView(): TModule {
  const { _id: id, _type: type } = mockRawCtaRef();

  return { id, type };
}

export function mockRawContentRef() {
  return { _id: MOCK_CONTENT_MODULE_ID, _type: 'module_content' } as const;
}

export function mockContentSlotView(): TModule {
  const { _id: id, _type: type } = mockRawContentRef();

  return { id, type };
}

export function mockListModuleRefs() {
  return [{ _ref: MOCK_LIST_MODULE_ID }];
}

export function mockListModulePageSize() {
  return { _id: MOCK_LIST_MODULE_ID, pageSize: MOCK_POST_LIST_PAGE_SIZE };
}

export function mockRawPostLatestRef() {
  return {
    _id: MOCK_POST_LATEST_MODULE_ID,
    _type: 'module_postLatest',
  } as const;
}

export function mockTemplatedPageDocument({
  template,
  ...fields
}: { _type: string; template?: typeof MOCK_TEMPLATE_REFERENCE } & Record<
  string,
  unknown
>) {
  return { _id: 'page-a', ...fields, ...(template ? { template } : {}) };
}

export function mockIndexPageDocument({
  _type,
  heading,
  language,
}: {
  _type: string;
  heading: string;
  language?: string;
}) {
  return {
    _id: language === LOCALE_ISO_CODES.NL ? `${_type}-nl` : _type,
    _type,
    headingBlock: { heading },
    ...(language ? { language } : {}),
  };
}

export function mockSlugPageDocument({
  _id = faker.string.uuid(),
  _type,
  slug,
  language,
  ...fields
}: {
  _id?: string;
  _type: string;
  slug: string;
  language: string;
} & Record<string, unknown>) {
  return { _id, _type, slug: { current: slug }, language, ...fields };
}

export function mockTranslatedSlugPageDocuments({
  _type,
  slug,
  headings,
}: {
  _type: string;
  slug: string;
  headings: Record<string, string>;
}) {
  const pages = Object.entries(headings).map(([language, heading]) =>
    mockSlugPageDocument({
      _type,
      slug,
      language,
      headingBlock: { heading },
    }),
  );

  return [
    ...pages,
    {
      _id: faker.string.uuid(),
      _type: 'translation.metadata',
      translations: pages.map(({ _id, language }) =>
        mockTranslationLink(language, _id),
      ),
    },
  ];
}

export function mockTemplateLayoutDocuments({ _type }: { _type: string }) {
  return [
    {
      _id: MOCK_TEMPLATE_REFERENCE._ref,
      _type,
      hero: mockReference(MOCK_HERO_MODULE_ID),
      modules: [
        mockReference(MOCK_POST_LATEST_MODULE_ID, {
          _key: MOCK_POST_LATEST_MODULE_ID,
        }),
      ],
    },
    mockRawHeroRef(),
    mockRawPostLatestRef(),
  ];
}

function mockRawPostSummary() {
  return {
    _id: MOCK_POST_ID,
    headingBlock: mockRawHeadingBlock(MOCK_POST_TITLE, {
      supportingText: MOCK_POST_EXCERPT,
    }),
    slug: MOCK_POST_SLUG,
    publishedAt: MOCK_POST_PUBLISHED_AT,
    heroImage: mockRawSanityImage(),
    featured: false,
    topic: mockRawTopic(),
    wordCount: 400,
  };
}

export function mockRawPostCard(
  overrides: Partial<TRawPostCard> = {},
): TRawPostCard {
  return {
    ...mockRawPostSummary(),
    author: mockRawPersonCard({ image: mockRawAuthor().image }),
    ...overrides,
  };
}

export function mockRawPostDetail(
  overrides: Partial<TRawPostDetail> = {},
): TRawPostDetail {
  return {
    ...mockRawPostSummary(),
    body: [],
    postTakeaways: null,
    seo: mockRawSeo(),
    author: mockRawAuthor(),
    tags: [mockRawTag()],
    modules: [],
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: MOCK_POST_SLUG }],
    ...overrides,
  };
}

export function mockRawHomePage(
  overrides: Partial<TRawHomePage> = {},
): TRawHomePage {
  return {
    _id: MOCK_HOME_PAGE_ID,
    headingBlock: mockRawHeadingBlock('Welcome'),
    contentAlignment: null,
    hero: mockRawHeroRef(),
    modules: [mockRawPostLatestRef(), mockRawCtaRef()],
    seo: mockRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN }],
    ...overrides,
  };
}

export function mockRawBlogPage(
  overrides: Partial<NonNullable<TRawBlogPage>> = {},
): NonNullable<TRawBlogPage> {
  return {
    headingBlock: mockRawHeadingBlock('The Blog', {
      supportingText: 'Notes on building things.',
    }),
    contentAlignment: null,
    hero: null,
    modules: [],
    seo: mockRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN }],
    ...overrides,
  };
}

export function mockRawTopicIndexPage(
  overrides: Partial<TRawTopicIndexPage> = {},
): TRawTopicIndexPage {
  return {
    headingBlock: mockRawHeadingBlock(MOCK_TOPIC_INDEX_HEADING),
    contentAlignment: null,
    hero: null,
    modules: [mockRawTaxonomyListRef()],
    seo: mockRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN }],
    ...overrides,
  };
}

export function mockRawTagIndexPage(
  overrides: Partial<TRawTagIndexPage> = {},
): TRawTagIndexPage {
  return {
    headingBlock: mockRawHeadingBlock(MOCK_TAG_INDEX_HEADING),
    contentAlignment: null,
    hero: null,
    modules: [mockRawTaxonomyListRef()],
    seo: mockRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN }],
    ...overrides,
  };
}

export function mockRawTopicPage(
  overrides: Partial<TRawTopicPage> = {},
): TRawTopicPage {
  return {
    topic: mockRawTopic(),
    headingBlock: mockRawHeadingBlock(MOCK_TOPIC_TITLE),
    contentAlignment: null,
    hero: null,
    modules: [{ _id: POST_LIST_MODULE_ID, _type: 'module_postList' }],
    seo: mockRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: MOCK_TOPIC_SLUG }],
    ...overrides,
  };
}

export function mockRawTagPage(
  overrides: Partial<TRawTagPage> = {},
): TRawTagPage {
  return {
    tag: { ...mockRawTag(), description: MOCK_TAG_PAGE_DESCRIPTION },
    headingBlock: mockRawHeadingBlock(MOCK_TAG_TITLE),
    contentAlignment: null,
    hero: null,
    modules: [{ _id: POST_LIST_MODULE_ID, _type: 'module_postList' }],
    seo: mockRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: MOCK_TAG_SLUG }],
    ...overrides,
  };
}

export function mockRawLandingPage(
  overrides: Partial<TRawLandingPage> = {},
): TRawLandingPage {
  return {
    _id: MOCK_ABOUT_SLUG,
    path: MOCK_ABOUT_SLUG,
    headingBlock: mockRawHeadingBlock(MOCK_ABOUT_PAGE_TITLE),
    contentAlignment: null,
    hero: null,
    modules: [mockRawContentRef(), mockRawCtaRef()],
    seo: mockRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: MOCK_ABOUT_SLUG }],
    showSectionNavigation: null,
    sectionChain: [
      {
        _id: MOCK_ABOUT_SLUG,
        title: MOCK_ABOUT_PAGE_TITLE,
        path: MOCK_ABOUT_SLUG,
        sectionNavigation: false,
        sectionNavigationTitle: null,
        children: null,
      },
    ],
    ...overrides,
  };
}
