import type { TPostDetail } from '@blog/service';
import { describe, expect, it, vi } from 'vitest';

import { buildPostMetadata } from './build-post-metadata';

const { getPostMock } = vi.hoisted(() => ({
  getPostMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      post: { v1: { getPost: getPostMock } },
    },
  },
}));

const basePost: TPostDetail = {
  id: 'post-1',
  title: 'Hello World',
  slug: 'hello-world',
  excerpt: 'A sufficiently long excerpt for the card.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImageUrl: 'https://cdn.example.com/hero.jpg',
  heroImageAlt: 'A hero image',
  heroImageSanity: undefined,
  featured: false,
  body: [],
  seo: undefined,
  author: undefined,
  categories: [],
};

describe('buildPostMetadata', () => {
  it('returns empty metadata when the post does not exist', async () => {
    getPostMock.mockResolvedValue(null);

    const metadata = await buildPostMetadata('missing');

    expect(metadata).toEqual({});
  });

  it('falls back to post title/excerpt/heroImage when seo is not authored', async () => {
    getPostMock.mockResolvedValue(basePost);

    const metadata = await buildPostMetadata('hello-world');

    expect(metadata.title).toBe('Hello World');
    expect(metadata.description).toBe(
      'A sufficiently long excerpt for the card.',
    );
    expect(metadata.alternates?.canonical).toBe('/blog/hello-world');
    expect(metadata.openGraph?.title).toBe('Hello World');
    expect(metadata.openGraph?.description).toBe(
      'A sufficiently long excerpt for the card.',
    );
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/hero.jpg' },
    ]);
  });

  it('prefers authored seo overrides field-by-field', async () => {
    getPostMock.mockResolvedValue({
      ...basePost,
      seo: {
        metaTitle: 'Authored Title',
        metaDescription: 'Authored description.',
        ogTitle: 'Authored OG Title',
        ogDescription: undefined,
        ogImageUrl: 'https://cdn.example.com/og.jpg',
      },
    });

    const metadata = await buildPostMetadata('hello-world');

    expect(metadata.title).toBe('Authored Title');
    expect(metadata.description).toBe('Authored description.');
    expect(metadata.openGraph?.title).toBe('Authored OG Title');
    // Falls back to the resolved description (own metaDescription), not the
    // post excerpt, when only ogDescription is missing.
    expect(metadata.openGraph?.description).toBe('Authored description.');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/og.jpg' },
    ]);
  });
});
