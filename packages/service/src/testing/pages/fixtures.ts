import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { TRawHomePage } from '@blog/service/features/pages/home/adaptor/transformer';
import type { TRawLandingPage } from '@blog/service/features/pages/landing/adaptor/detail-page/transformer';
import type { TRawPostDetail } from '@blog/service/features/pages/post/adaptor/detail-page/transformer';
import type { TRawBlogPage } from '@blog/service/features/pages/post-index/adaptor/index-page/transformer';
import type { TRawTagPage } from '@blog/service/features/pages/tag/adaptor/detail-page/transformer';
import type { TRawTagIndexPage } from '@blog/service/features/pages/tag-index/adaptor/transformer';
import type { TRawTopicPage } from '@blog/service/features/pages/topic/adaptor/detail-page/transformer';
import type { TRawTopicIndexPage } from '@blog/service/features/pages/topic-index/adaptor/transformer';
import type { TRawPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import {
  makeRawTag,
  makeRawTopic,
} from '@blog/service/testing/entities/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSanityImage,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';

const AUTHOR_AVATAR_ALT = 'Jane avatar';
const POST_SLUG = 'hello-world';
const TAXONOMY_LIST_MODULE_ID = 'taxonomy-list-1';
const POST_LIST_MODULE_ID = 'post-list-1';

export function makeRawAuthor(
  overrides: Partial<TRawPostDetail['author']> = {},
): TRawPostDetail['author'] {
  return {
    _id: 'author-1',
    name: 'Jane Doe',
    image: makeRawSanityImage(AUTHOR_AVATAR_ALT),
    profilePage: null,
    role: 'Writer',
    bio: null,
    socialLinks: null,
    ...overrides,
  };
}

function makeRawPostSummary() {
  return {
    _id: 'post-1',
    headingBlock: makeRawHeadingBlock('Hello World', {
      supportingText: 'A sufficiently long excerpt for the card.',
    }),
    slug: POST_SLUG,
    publishedAt: '2026-01-15T00:00:00Z',
    heroImage: makeRawSanityImage(),
    featured: false,
    topic: {
      _id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
    },
    wordCount: 400,
  };
}

export function makeRawPostCard(
  overrides: Partial<TRawPostCard> = {},
): TRawPostCard {
  const { _id, name, image, profilePage } = makeRawAuthor();

  return {
    ...makeRawPostSummary(),
    author: { _id, name, image, profilePage },
    ...overrides,
  };
}

export function makeRawPostDetail(
  overrides: Partial<TRawPostDetail> = {},
): TRawPostDetail {
  return {
    ...makeRawPostSummary(),
    body: [],
    postTakeaways: null,
    seo: makeRawSeo(),
    author: makeRawAuthor(),
    tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
    modules: [],
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: POST_SLUG }],
    ...overrides,
  };
}

export function makeRawHomePage(
  overrides: Partial<TRawHomePage> = {},
): TRawHomePage {
  return {
    _id: 'home-1',
    headingBlock: makeRawHeadingBlock('Welcome'),
    contentAlignment: null,
    hero: { _id: 'hero-1', _type: 'module_heroBlog' },
    modules: [
      { _id: 'post-latest-1', _type: 'module_postLatest' },
      { _id: 'cta-1', _type: 'module_cta' },
    ],
    seo: makeRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN }],
    ...overrides,
  };
}

export function makeRawBlogPage(
  overrides: Partial<NonNullable<TRawBlogPage>> = {},
): NonNullable<TRawBlogPage> {
  return {
    headingBlock: makeRawHeadingBlock('The Blog', {
      supportingText: 'Notes on building things.',
    }),
    contentAlignment: null,
    hero: null,
    modules: [],
    seo: makeRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN }],
    ...overrides,
  };
}

export function makeRawTopicIndexPage(
  overrides: Partial<TRawTopicIndexPage> = {},
): TRawTopicIndexPage {
  return {
    headingBlock: makeRawHeadingBlock('Browse by topic'),
    contentAlignment: null,
    hero: null,
    modules: [{ _id: TAXONOMY_LIST_MODULE_ID, _type: 'module_taxonomyList' }],
    seo: makeRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN }],
    ...overrides,
  };
}

export function makeRawTagIndexPage(
  overrides: Partial<TRawTagIndexPage> = {},
): TRawTagIndexPage {
  return {
    headingBlock: makeRawHeadingBlock('Browse by tag'),
    contentAlignment: null,
    hero: null,
    modules: [{ _id: TAXONOMY_LIST_MODULE_ID, _type: 'module_taxonomyList' }],
    seo: makeRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN }],
    ...overrides,
  };
}

export function makeRawTopicPage(
  overrides: Partial<TRawTopicPage> = {},
): TRawTopicPage {
  return {
    topic: makeRawTopic(),
    headingBlock: makeRawHeadingBlock('Engineering'),
    contentAlignment: null,
    hero: null,
    modules: [{ _id: POST_LIST_MODULE_ID, _type: 'module_postList' }],
    seo: makeRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: 'engineering' }],
    ...overrides,
  };
}

export function makeRawTagPage(
  overrides: Partial<TRawTagPage> = {},
): TRawTagPage {
  return {
    tag: { ...makeRawTag(), description: 'Posts about TypeScript.' },
    headingBlock: makeRawHeadingBlock('TypeScript'),
    contentAlignment: null,
    hero: null,
    modules: [{ _id: POST_LIST_MODULE_ID, _type: 'module_postList' }],
    seo: makeRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: 'typescript' }],
    ...overrides,
  };
}

export function makeRawLandingPage(
  overrides: Partial<TRawLandingPage> = {},
): TRawLandingPage {
  return {
    _id: 'about',
    path: 'about',
    headingBlock: makeRawHeadingBlock('About Us'),
    contentAlignment: null,
    hero: null,
    modules: [
      { _id: 'content-1', _type: 'module_content' },
      { _id: 'cta-1', _type: 'module_cta' },
    ],
    seo: makeRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: 'about' }],
    showSectionNavigation: null,
    sectionChain: [
      {
        _id: 'about',
        title: 'About Us',
        path: 'about',
        sectionNavigation: false,
        sectionNavigationTitle: null,
        children: null,
      },
    ],
    ...overrides,
  };
}
