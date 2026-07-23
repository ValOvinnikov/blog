import type { TPostDetail } from '@blog/service';
import { makeSeo } from '@web/testing/shared/seo/fixtures';

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
  seo: makeSeo({
    title: 'Hello World',
    description: 'A sufficiently long excerpt for the card.',
    ogTitle: 'Hello World OG',
    ogDescription: 'A sufficiently long excerpt for the card OG.',
    ogImageUrl: 'https://cdn.example.com/hero.jpg',
  }),
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    imageUrl: undefined,
    role: undefined,
    bio: undefined,
    socialLinks: [],
  },
  categories: [],
  tags: [],
  relatedPosts: [],
};

describe('buildPostMetadata', () => {
  it('returns empty metadata when the post does not exist', async () => {
    getPostMock.mockResolvedValue(null);

    const metadata = await buildPostMetadata('missing');

    expect(metadata).toEqual({});
  });

  it('passes the already-resolved seo through to toMetadata', async () => {
    getPostMock.mockResolvedValue(basePost);

    const metadata = await buildPostMetadata('hello-world');

    expect(metadata.title).toBe('Hello World');
    expect(metadata.description).toBe(
      'A sufficiently long excerpt for the card.',
    );
    expect(metadata.alternates?.canonical).toBe('/blog/hello-world');
    expect(metadata.openGraph?.title).toBe('Hello World OG');
    expect(metadata.openGraph?.description).toBe(
      'A sufficiently long excerpt for the card OG.',
    );
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/hero.jpg' },
    ]);
  });

  it('sets openGraph.publishedTime from post.publishedAt', async () => {
    getPostMock.mockResolvedValue(basePost);

    const metadata = await buildPostMetadata('hello-world');

    expect(
      (metadata.openGraph as { publishedTime?: string })?.publishedTime,
    ).toBe('2026-01-15T00:00:00Z');
  });

  it('sets openGraph.authors from post.author.name', async () => {
    getPostMock.mockResolvedValue(basePost);

    const metadata = await buildPostMetadata('hello-world');

    expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
      'Jane Doe',
    ]);
  });
});
