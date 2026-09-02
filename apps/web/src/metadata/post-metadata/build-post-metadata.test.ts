import type { TPostDetail } from '@blog/service';
import { makeSeo } from '@web/testing/shared/seo/fixtures';

import { buildPostMetadata } from './build-post-metadata';

const { getPostMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getPostMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      post: { v1: { getPost: getPostMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
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
  newsletterEnabled: true,
  body: [],
  skim: undefined,
  hasAsides: false,
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
    profilePageSlug: 'jane-doe',
    imageUrl: undefined,
    role: undefined,
    bio: undefined,
    socialLinks: [],
  },
  topic: {
    id: 'topic-1',
    title: 'News',
    slug: 'news',
    description: undefined,
  },
  tags: [],
  relatedPosts: [],
  readingTimeMinutes: 4,
};

describe('buildPostMetadata', () => {
  beforeEach(() => {
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
  });

  it('forwards the resolved tenant Sanity context to getPost', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getPostMock.mockResolvedValue({ ok: true, data: basePost });

    await buildPostMetadata('hello-world');

    expect(getPostMock).toHaveBeenCalledWith('hello-world', tenant);
  });

  it('returns empty metadata without logging when no page_post matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildPostMetadata('missing');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('returns empty metadata when the post fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const metadata = await buildPostMetadata('hello-world');

    expect(metadata).toEqual({});
    errorSpy.mockRestore();
  });

  it('passes the already-resolved seo through to toMetadata', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: basePost });

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
    getPostMock.mockResolvedValue({ ok: true, data: basePost });

    const metadata = await buildPostMetadata('hello-world');

    expect(
      (metadata.openGraph as { publishedTime?: string })?.publishedTime,
    ).toBe('2026-01-15T00:00:00Z');
  });

  it('sets openGraph.authors from post.author.name', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: basePost });

    const metadata = await buildPostMetadata('hello-world');

    expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
      'Jane Doe',
    ]);
  });
});
