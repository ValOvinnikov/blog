import { MODULE_TYPE } from '@blog/config';

import type { TRawHomePage } from '#/features/pages/home/adaptor/transformer';
import type { TRawPostDetail } from '#/features/pages/post/adaptor/detail/transformer';
import type { TRawPostCard } from '#/shared/transformers/to-post-card';
import { makeRawImage, makeRawSanityImage } from '#/testing/shared/fixtures';

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
    hero: { key: 'hero-ref', id: 'hero-1', type: MODULE_TYPE.HERO },
    modules: [
      { key: 'module-1', id: 'post-list-1', type: MODULE_TYPE.POST_LIST },
      { key: 'module-2', id: 'cta-1', type: MODULE_TYPE.CTA },
    ],
    seo: null,
    ...overrides,
  };
}
