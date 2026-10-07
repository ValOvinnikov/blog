import { LOCALE_ISO_CODES } from '@blog/config';
import { type TPostDetail, urlForSanityImage } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import type { MockInstance } from 'vitest';

import { buildPostMetadata } from './build-post-metadata';

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const ogImage = makeSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const basePost: TPostDetail = {
  id: 'post-1',
  title: 'Hello World',
  slug: 'hello-world',
  excerpt: 'A sufficiently long excerpt for the card.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImage: ogImage,
  featured: false,
  body: [],
  postTakeaways: undefined,
  hasAsides: false,
  modules: [],
  seo: makeSeo({
    title: 'Hello World',
    description: 'A sufficiently long excerpt for the card.',
    ogTitle: 'Hello World OG',
    ogDescription: 'A sufficiently long excerpt for the card OG.',
    ogImage,
  }),
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    profileUrl: '/jane-doe',
    image: undefined,
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
  readingTimeMinutes: 4,
  translations: [],
};

describe('buildPostMetadata', () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
  });

  describe('when the post resolves', () => {
    beforeEach(() => {
      getPostPageMock.mockResolvedValue({ ok: true, data: basePost });
    });

    it('forwards the slug to getPostPage, the loader BlogPostPage reads', async () => {
      await buildPostMetadata('hello-world');

      expect(getPostPageMock).toHaveBeenCalledWith('hello-world');
    });

    it('passes the already-resolved seo through to toMetadata', async () => {
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
        { url: EXPECTED_OG_IMAGE_URL },
      ]);
    });

    it('sets openGraph.publishedTime from post.publishedAt', async () => {
      const metadata = await buildPostMetadata('hello-world');

      expect(
        (metadata.openGraph as { publishedTime?: string })?.publishedTime,
      ).toBe('2026-01-15T00:00:00Z');
    });

    it('sets openGraph.authors from post.author.name', async () => {
      const metadata = await buildPostMetadata('hello-world');

      expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
        'Jane Doe',
      ]);
    });
  });

  describe('when no metadata can be built', () => {
    let errorSpy: MockInstance<typeof console.error>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('returns empty metadata without logging when no page_post matches the slug', async () => {
      getPostPageMock.mockResolvedValue({ ok: true, data: undefined });

      const metadata = await buildPostMetadata('missing');

      expect(metadata).toEqual({});
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('returns empty metadata when the post fetch fails', async () => {
      getPostPageMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const metadata = await buildPostMetadata('hello-world');

      expect(metadata).toEqual({});
    });
  });
});

describe('buildPostMetadata per language', () => {
  const { EN, NL, DE } = LOCALE_ISO_CODES;

  beforeEach(() => {
    getPostPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...basePost,
        slug: 'mijn-artikel',
        translations: [
          { language: EN, slug: 'my-article' },
          { language: NL, slug: 'mijn-artikel' },
          { language: DE, slug: 'mein-artikel' },
        ],
      },
    });
  });

  afterEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('lists each live language under its own slug as hreflang, canonical to its own prefixed address', async () => {
    const metadata = await buildPostMetadata('mijn-artikel');

    expect(metadata.alternates).toMatchObject({
      canonical: '/nl/blog/mijn-artikel',
      languages: {
        en: '/blog/my-article',
        nl: '/nl/blog/mijn-artikel',
        'x-default': '/blog/my-article',
      },
    });
  });
});
