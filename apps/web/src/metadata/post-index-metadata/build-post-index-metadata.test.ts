import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { type TBlogIndexPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_OG_IMAGE,
  MOCK_OG_IMAGE_URL,
} from '@web/testing/shared/seo/og-image-fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildPostIndexMetadata } from './build-post-index-metadata';

const { getPostIndexPageMock } = vi.hoisted(() => ({
  getPostIndexPageMock: vi.fn(),
}));

vi.mock(
  '@web/server/post-index/get-post-index-page/get-post-index-page',
  () => ({
    getPostIndexPage: getPostIndexPageMock,
  }),
);

vi.mock('@web/server/request-context/request-context');

const TITLE = 'The Blog';
const DESCRIPTION = 'All the posts.';
const BLOG_PATH = routes.blogIndex();
const RSS_TYPES = { 'application/rss+xml': routes.rssFeed() };
const OG_DESCRIPTION = 'All the posts OG.';
const PAGE_TWO_OG_TITLE = 'The Blog OG – Page 2';
const OG_TITLE = 'The Blog OG';

const seo = mockSeo({
  title: TITLE,
  description: DESCRIPTION,
  ogTitle: OG_TITLE,
  ogDescription: OG_DESCRIPTION,
  ogImage: MOCK_OG_IMAGE,
});

const resolveIndexPageWith = (overrides: Partial<TBlogIndexPage> = {}) =>
  getPostIndexPageMock.mockResolvedValue(
    okResult({
      headingBlock: mockHeadingBlock({ heading: 'Blog' }),
      seo,
      modules: [],
      translations: [LOCALE_ISO_CODES.EN],
      ...overrides,
    }),
  );

describe(buildPostIndexMetadata, () => {
  beforeEach(() => {
    getPostIndexPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
  });

  describe('when the index page resolves', () => {
    beforeEach(() => {
      resolveIndexPageWith();
    });

    it('reads the same index page the post index renders', async () => {
      await buildPostIndexMetadata(1);

      expect(getPostIndexPageMock).toHaveBeenCalledWith();
    });

    it('builds page-1 metadata from the seo, canonical to /blog', async () => {
      const metadata = await buildPostIndexMetadata(1);

      expect(metadata.title).toBe(TITLE);
      expect(metadata.description).toBe(DESCRIPTION);
      expect(metadata.alternates?.canonical).toBe(BLOG_PATH);
      expect(metadata.openGraph?.title).toBe(OG_TITLE);
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
      expect(metadata.alternates?.types).toEqual(RSS_TYPES);
    });

    it('suffixes page-N titles with the page, canonical to /blog/page/N', async () => {
      const metadata = await buildPostIndexMetadata(2);

      expect(metadata.title).toBe(`${TITLE} – Page 2`);
      expect(metadata.openGraph?.title).toBe(PAGE_TWO_OG_TITLE);
      expect(metadata.twitter?.title).toBe(PAGE_TWO_OG_TITLE);
      expect(metadata.alternates?.canonical).toBe(routes.blogIndex(2));
      expect(metadata.alternates?.types).toEqual(RSS_TYPES);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the index page fetch fails', async () => {
      getPostIndexPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildPostIndexMetadata(1);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'post_index_metadata.fetch_failed',
        { page: 1, error: MOCK_ERROR },
      );
    });

    it('returns empty metadata without logging when there is no index page', async () => {
      getPostIndexPageMock.mockResolvedValue(okResult());

      const metadata = await buildPostIndexMetadata(1);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
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
    });

    it('lists each live translated language as hreflang, canonical to its prefix', async () => {
      const translations = [EN, NL, DE];
      resolveIndexPageWith({ translations });

      const metadata = await buildPostIndexMetadata(1);

      expect(metadata.alternates).toEqual({
        canonical: `/nl${BLOG_PATH}`,
        languages: {
          en: BLOG_PATH,
          nl: `/nl${BLOG_PATH}`,
          'x-default': BLOG_PATH,
        },
        types: { 'application/rss+xml': `/nl${routes.rssFeed()}` },
      });
    });

    it('lists no hreflang past page 1', async () => {
      const translations = [EN, NL];
      resolveIndexPageWith({ translations });

      const metadata = await buildPostIndexMetadata(2);

      expect(metadata.alternates?.canonical).toBe(`/nl${routes.blogIndex(2)}`);
      expect(metadata.alternates?.languages).toBeUndefined();
    });
  });

  it('omits the OG title past page 1 when none is authored', async () => {
    resolveIndexPageWith({
      seo: mockSeo({ title: TITLE, ogTitle: undefined }),
    });

    const metadata = await buildPostIndexMetadata(2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });
});
