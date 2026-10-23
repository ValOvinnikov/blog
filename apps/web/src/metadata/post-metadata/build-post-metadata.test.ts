import { LOCALE_ISO_CODES } from '@blog/config';
import { type TPostDetail, urlForSanityImage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

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

const TITLE = 'Hello World';
const SLUG = 'hello-world';
const EXCERPT = 'A sufficiently long excerpt for the card.';
const PUBLISHED_AT = '2026-01-15T00:00:00Z';
const OG_TITLE = 'Hello World OG';
const OG_DESCRIPTION = 'A sufficiently long excerpt for the card OG.';
const NL_SLUG = 'mijn-artikel';
const NL_POST_PATH = '/nl/blog/mijn-artikel';
const EN_POST_PATH = '/blog/my-article';

const basePost: TPostDetail = {
  id: 'post-1',
  title: TITLE,
  slug: SLUG,
  excerpt: EXCERPT,
  publishedAt: PUBLISHED_AT,
  heroImage: ogImage,
  featured: false,
  body: [],
  postTakeaways: undefined,
  hasAsides: false,
  modules: [],
  seo: makeSeo({
    title: TITLE,
    description: EXCERPT,
    ogTitle: OG_TITLE,
    ogDescription: OG_DESCRIPTION,
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
      getPostPageMock.mockResolvedValue(okResult(basePost));
    });

    it('forwards the slug to getPostPage, the loader BlogPostPage reads', async () => {
      await buildPostMetadata(SLUG);

      expect(getPostPageMock).toHaveBeenCalledWith(SLUG);
    });

    it('passes the already-resolved seo through to toMetadata', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect(metadata.title).toBe(TITLE);
      expect(metadata.description).toBe(EXCERPT);
      expect(metadata.alternates?.canonical).toBe('/blog/hello-world');
      expect(metadata.openGraph?.title).toBe(OG_TITLE);
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([
        { url: EXPECTED_OG_IMAGE_URL },
      ]);
    });

    it('sets openGraph.publishedTime from post.publishedAt', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect(
        (metadata.openGraph as { publishedTime?: string })?.publishedTime,
      ).toBe(PUBLISHED_AT);
    });

    it('sets openGraph.authors from post.author.name', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
        'Jane Doe',
      ]);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata without logging when no page_post matches the slug', async () => {
      getPostPageMock.mockResolvedValue(okResult());

      const metadata = await buildPostMetadata('missing');

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });

    it('returns empty metadata when the post fetch fails', async () => {
      getPostPageMock.mockResolvedValue(errorResult(new Error('boom')));

      const metadata = await buildPostMetadata(SLUG);

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
    getPostPageMock.mockResolvedValue(
      okResult({
        ...basePost,
        slug: NL_SLUG,
        translations: [
          { language: EN, slug: 'my-article' },
          { language: NL, slug: NL_SLUG },
          { language: DE, slug: 'mein-artikel' },
        ],
      }),
    );
  });

  afterEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('lists each live language under its own slug as hreflang, canonical to its own prefixed address', async () => {
    const metadata = await buildPostMetadata(NL_SLUG);

    expect(metadata.alternates).toMatchObject({
      canonical: NL_POST_PATH,
      languages: {
        en: EN_POST_PATH,
        nl: NL_POST_PATH,
        'x-default': EN_POST_PATH,
      },
    });
  });
});
