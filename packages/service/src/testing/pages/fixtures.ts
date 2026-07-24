import type { TRawBlogPage } from '@blog/service/features/pages/blog/adaptor/index-page/transformer';
import type { TRawGenericPage } from '@blog/service/features/pages/generic/adaptor/transformer';
import type { TRawHomePage } from '@blog/service/features/pages/home/adaptor/transformer';
import type { TRawPostDetail } from '@blog/service/features/pages/post/adaptor/detail/transformer';
import type { TRawTagPageTag } from '@blog/service/features/pages/tag/adaptor/detail-page/transformer';
import type { TRawArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import type { TRawPostCard } from '@blog/service/shared/transformers/to-post-card';
import {
  makeRawImage,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

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
      slug: 'jane-doe',
      image: makeRawImage('Jane avatar'),
    },
    category: {
      _id: 'cat-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
    },
    ...overrides,
  };
}

// Archive-listing cards render text-only (decision #624) — no
// heroImage/featured/author fields to override, unlike `makeRawPostCard`.
export function makeRawArchivePostCard(
  overrides: Partial<TRawArchivePostCard> = {},
): TRawArchivePostCard {
  return {
    _id: 'post-1',
    title: 'Hello World',
    slug: 'hello-world',
    excerpt: 'A sufficiently long excerpt for the card.',
    publishedAt: '2026-01-15T00:00:00Z',
    category: {
      _id: 'cat-1',
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
    body: [],
    seo: null,
    author: {
      _id: 'author-1',
      name: 'Jane Doe',
      slug: 'jane-doe',
      image: makeRawImage('Jane avatar'),
      role: 'Writer',
      bio: null,
      socialLinks: null,
    },
    category: {
      _id: 'cat-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
    },
    tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
    wordCount: 400,
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
      { _id: 'post-list-1', _type: 'module_postList' },
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
    itemsPerPage: 9,
    seo: null,
    ...overrides,
  };
}

export function makeRawTagPageTag(
  overrides: Partial<TRawTagPageTag> = {},
): TRawTagPageTag {
  return {
    _id: 'tag-1',
    title: 'TypeScript',
    slug: 'typescript',
    description: 'Posts about TypeScript.',
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
