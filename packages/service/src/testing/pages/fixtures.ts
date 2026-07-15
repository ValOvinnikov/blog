import type { TRawBlogIndexSettings } from '@blog/service/features/pages/blog/adaptor/settings/transformer';
import type { TRawGenericPage } from '@blog/service/features/pages/generic/adaptor/transformer';
import type { TRawHomePage } from '@blog/service/features/pages/home/adaptor/transformer';
import type { TRawPostDetail } from '@blog/service/features/pages/post/adaptor/detail/transformer';
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
    mainImage: makeRawImage(),
    mainImageAsset: makeRawSanityImage(),
    featured: false,
    author: {
      _id: 'author-1',
      name: 'Jane Doe',
      slug: 'jane-doe',
      image: makeRawImage('Jane avatar'),
      role: 'Writer',
    },
    categories: [
      {
        _id: 'cat-1',
        title: 'Engineering',
        slug: 'engineering',
        description: 'Engineering posts',
      },
    ],
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
    mainImage: makeRawImage(),
    mainImageAsset: makeRawSanityImage(),
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
    categories: [
      {
        _id: 'cat-1',
        title: 'Engineering',
        slug: 'engineering',
        description: 'Engineering posts',
      },
    ],
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

export function makeRawBlogIndexSettings(
  overrides: Partial<NonNullable<TRawBlogIndexSettings>> = {},
): NonNullable<TRawBlogIndexSettings> {
  return {
    heading: 'The Blog',
    supportingText: 'Notes on building things.',
    itemsPerPage: 9,
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
