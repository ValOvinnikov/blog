import type { TRawBlogPage } from '@blog/service/features/pages/blog/adaptor/index-page/transformer';
import type { TRawGenericPage } from '@blog/service/features/pages/generic/adaptor/detail-page/transformer';
import type { TRawHomePage } from '@blog/service/features/pages/home/adaptor/transformer';
import type {
  TRawPostDetail,
  TRawPostPage,
} from '@blog/service/features/pages/post/adaptor/detail-page/transformer';
import type { TRawTagPage } from '@blog/service/features/pages/tag/adaptor/detail-page/transformer';
import type { TRawTagIndexPage } from '@blog/service/features/pages/tag-index/adaptor/transformer';
import type { TRawTopicPage } from '@blog/service/features/pages/topic/adaptor/detail-page/transformer';
import type { TRawTopicIndexPage } from '@blog/service/features/pages/topic-index/adaptor/transformer';
import type { TRawArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import type { TRawPostCard } from '@blog/service/shared/transformers/to-post-card';
import {
  makeRawTag,
  makeRawTopic,
} from '@blog/service/testing/entities/fixtures';
import {
  makeRawImage,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

export function makeRawAuthor(
  overrides: Partial<TRawPostDetail['author']> = {},
): TRawPostDetail['author'] {
  return {
    _id: 'author-1',
    name: 'Jane Doe',
    image: makeRawImage('Jane avatar'),
    profilePage: null,
    role: 'Writer',
    bio: null,
    socialLinks: null,
    ...overrides,
  };
}

export function makeRawPostCard(
  overrides: Partial<TRawPostCard> = {},
): TRawPostCard {
  return {
    _id: 'post-1',
    title: 'Hello World',
    slug: 'hello-world',
    excerpt: 'A sufficiently long excerpt for the card.',
    publishedAt: '2026-01-15T00:00:00Z',
    heroImage: makeRawImage(),
    heroImageAsset: makeRawSanityImage(),
    featured: false,
    author: {
      _id: 'author-1',
      name: 'Jane Doe',
      image: makeRawImage('Jane avatar'),
      profilePage: null,
    },
    topic: {
      _id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
    },
    wordCount: 400,
    ...overrides,
  };
}

// Archive-listing cards render text-only — no heroImage/featured/author
// fields to override, unlike `makeRawPostCard`.
export function makeRawArchivePostCard(
  overrides: Partial<TRawArchivePostCard> = {},
): TRawArchivePostCard {
  return {
    _id: 'post-1',
    title: 'Hello World',
    slug: 'hello-world',
    excerpt: 'A sufficiently long excerpt for the card.',
    publishedAt: '2026-01-15T00:00:00Z',
    topic: {
      _id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
    },
    wordCount: 400,
    ...overrides,
  };
}

export function makeRawPostDetail(
  overrides: Partial<TRawPostDetail> = {},
): TRawPostDetail {
  return {
    _id: 'post-1',
    title: 'Hello World',
    slug: 'hello-world',
    excerpt: 'A sufficiently long excerpt for the card.',
    publishedAt: '2026-01-15T00:00:00Z',
    heroImage: makeRawImage(),
    heroImageAsset: makeRawSanityImage(),
    featured: false,
    newsletterEnabled: true,
    body: [],
    skim: null,
    seo: null,
    author: makeRawAuthor(),
    topic: {
      _id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
    },
    tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
    wordCount: 400,
    ...overrides,
  };
}

export function makeRawPostPage(
  overrides: Partial<TRawPostPage> = {},
): TRawPostPage {
  return {
    slug: 'hello-world',
    publishedAt: '2026-01-15T00:00:00Z',
    seo: null,
    post: makeRawPostDetail(),
    ...overrides,
  };
}

export function makeRawHomePage(
  overrides: Partial<TRawHomePage> = {},
): TRawHomePage {
  return {
    title: 'Home Page',
    hero: { _id: 'hero-1', _type: 'module_hero' },
    modules: [
      { _id: 'post-latest-1', _type: 'module_postLatest' },
      { _id: 'cta-1', _type: 'module_cta' },
    ],
    seo: null,
    ...overrides,
  };
}

export function makeRawBlogPage(
  overrides: Partial<NonNullable<TRawBlogPage>> = {},
): NonNullable<TRawBlogPage> {
  return {
    heading: 'The Blog',
    supportingText: 'Notes on building things.',
    postList: { _id: 'post-list-1' },
    modules: [],
    seo: null,
    ...overrides,
  };
}

export function makeRawTopicIndexPage(
  overrides: Partial<NonNullable<TRawTopicIndexPage>> = {},
): NonNullable<TRawTopicIndexPage> {
  return {
    heading: 'Browse by topic',
    supportingText: 'Find posts by subject.',
    taxonomyList: { _id: 'taxonomy-list-1' },
    seo: null,
    ...overrides,
  };
}

export function makeRawTagIndexPage(
  overrides: Partial<NonNullable<TRawTagIndexPage>> = {},
): NonNullable<TRawTagIndexPage> {
  return {
    heading: 'Browse by tag',
    supportingText: 'Find posts by keyword.',
    taxonomyList: { _id: 'taxonomy-list-1' },
    seo: null,
    ...overrides,
  };
}

export function makeRawTopicPage(
  overrides: Partial<TRawTopicPage> = {},
): TRawTopicPage {
  return {
    topic: makeRawTopic(),
    postList: { _id: 'post-list-1' },
    modules: [],
    seo: null,
    ...overrides,
  };
}

export function makeRawTagPage(
  overrides: Partial<TRawTagPage> = {},
): TRawTagPage {
  return {
    tag: { ...makeRawTag(), description: 'Posts about TypeScript.' },
    postList: { _id: 'post-list-1' },
    modules: [],
    seo: null,
    ...overrides,
  };
}

export function makeRawGenericPage(
  overrides: Partial<TRawGenericPage> = {},
): TRawGenericPage {
  return {
    title: 'About',
    slug: 'about',
    modules: [
      { _id: 'content-1', _type: 'module_content' },
      { _id: 'cta-1', _type: 'module_cta' },
    ],
    seo: null,
    ...overrides,
  };
}
