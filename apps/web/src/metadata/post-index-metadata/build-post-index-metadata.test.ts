import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { type TBlogIndexPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
  mockMetadataSeo,
  toPageSuffix,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_OG_IMAGE_URL } from '@web/testing/shared/seo/og-image-fixtures';
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

faker.seed(5204);

const { EN, NL, DE } = LOCALE_ISO_CODES;
const BLOG_PATH = routes.blogIndex();
const RSS_TYPES = { 'application/rss+xml': routes.rssFeed() };

const MOCK_SEO = mockMetadataSeo();
const { title, description, ogTitle, ogDescription } = MOCK_SEO;

const resolveIndexPageWith = (overrides: Partial<TBlogIndexPage> = {}) =>
  getPostIndexPageMock.mockResolvedValue(
    okResult({
      headingBlock: mockHeadingBlock({ heading: faker.lorem.word() }),
      seo: MOCK_SEO,
      modules: [],
      translations: [EN],
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

    it('reads the index page the post index renders', async () => {
      await buildPostIndexMetadata(1);

      expect(getPostIndexPageMock).toHaveBeenCalledWith();
    });

    it('builds page-1 metadata from the seo, canonical to the blog index', async () => {
      const metadata = await buildPostIndexMetadata(1);

      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(description);
      expect(metadata.alternates?.canonical).toBe(BLOG_PATH);
      expect(metadata.openGraph?.title).toBe(ogTitle);
      expect(metadata.openGraph?.description).toBe(ogDescription);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
      expect(metadata.alternates?.types).toEqual(RSS_TYPES);
    });

    it('suffixes page-N titles with the page, canonical to that page', async () => {
      const pageTitle = `${ogTitle} ${toPageSuffix(2)}`;

      const metadata = await buildPostIndexMetadata(2);

      expect(metadata.title).toBe(`${title} ${toPageSuffix(2)}`);
      expect(metadata.openGraph?.title).toBe(pageTitle);
      expect(metadata.twitter?.title).toBe(pageTitle);
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
    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue(
        MOCK_DUTCH_REQUEST_CONTEXT,
      );
    });

    it('lists each live translated language as hreflang, canonical to its prefix', async () => {
      resolveIndexPageWith({ translations: [EN, NL, DE] });

      const metadata = await buildPostIndexMetadata(1);

      expect(metadata.alternates).toEqual({
        canonical: `${NL_PATH_PREFIX}${BLOG_PATH}`,
        languages: {
          en: BLOG_PATH,
          nl: `${NL_PATH_PREFIX}${BLOG_PATH}`,
          'x-default': BLOG_PATH,
        },
        types: {
          'application/rss+xml': `${NL_PATH_PREFIX}${routes.rssFeed()}`,
        },
      });
    });

    it('lists no hreflang past page 1', async () => {
      resolveIndexPageWith({ translations: [EN, NL] });

      const metadata = await buildPostIndexMetadata(2);

      expect(metadata.alternates?.canonical).toBe(
        `${NL_PATH_PREFIX}${routes.blogIndex(2)}`,
      );
      expect(metadata.alternates?.languages).toBeUndefined();
    });
  });

  it('omits the OG title past page 1 when none is authored', async () => {
    resolveIndexPageWith({
      seo: mockMetadataSeo({ ogTitle: undefined }),
    });

    const metadata = await buildPostIndexMetadata(2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });
});
