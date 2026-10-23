import { LOCALE_ISO_CODES } from '@blog/config';
import { type TPostDetail, urlForSanityImage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
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

const ogImage = mockSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  MOCK_TENANT_SANITY_CONTEXT,
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
  seo: mockSeo({
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

describe(buildPostMetadata, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
  });

  describe('when the post resolves', () => {
    beforeEach(() => {
      getPostPageMock.mockResolvedValue(okResult(basePost));
    });

    it('reads the same post the post page renders', async () => {
      await buildPostMetadata(SLUG);

      expect(getPostPageMock).toHaveBeenCalledWith(SLUG);
    });

    it('builds the metadata from the resolved seo', async () => {
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

    it('sets the OG published time from the publish date', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect(
        (metadata.openGraph as { publishedTime?: string })?.publishedTime,
      ).toBe(PUBLISHED_AT);
    });

    it('sets the OG authors from the author name', async () => {
      const metadata = await buildPostMetadata(SLUG);

      expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
        'Jane Doe',
      ]);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata without logging when no post matches', async () => {
      getPostPageMock.mockResolvedValue(okResult());

      const metadata = await buildPostMetadata('missing');

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });

    it('returns empty metadata when the post fetch fails', async () => {
      getPostPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildPostMetadata(SLUG);

      expect(metadata).toEqual({});
    });
  });

  describe('for a Dutch-language request', () => {
    const { EN, NL, DE } = LOCALE_ISO_CODES;

    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...MOCK_REQUEST_CONTEXT,
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

    it('lists each live translation as hreflang, canonical to its prefix', async () => {
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
});
