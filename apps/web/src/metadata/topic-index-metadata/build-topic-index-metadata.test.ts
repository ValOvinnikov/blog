import { LOCALE_ISO_CODES, routes, type TLocaleIsoCode } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import { NL_TOPICS_INDEX_PATH } from '@web/testing/metadata/index-paths/fixtures';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  mockMetadataSeo,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_OG_IMAGE_URL } from '@web/testing/shared/seo/og-image-fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTopicIndexMetadata } from './build-topic-index-metadata';

const { getTopicIndexPageMock } = vi.hoisted(() => ({
  getTopicIndexPageMock: vi.fn(),
}));

vi.mock(
  '@web/server/topic-index/get-topic-index-page/get-topic-index-page',
  () => ({
    getTopicIndexPage: getTopicIndexPageMock,
  }),
);

vi.mock('@web/server/request-context/request-context');

faker.seed(5207);

const { EN, NL, DE } = LOCALE_ISO_CODES;
const INDEX_PATH = routes.topics();

const MOCK_SEO = mockMetadataSeo();
const { title, description, ogTitle, ogDescription } = MOCK_SEO;

const resolveIndexPageWith = (translations: TLocaleIsoCode[] = [EN]) =>
  getTopicIndexPageMock.mockResolvedValue(
    okResult({
      headingBlock: mockHeadingBlock({ heading: title }),
      seo: MOCK_SEO,
      modules: [],
      translations,
    }),
  );

describe(buildTopicIndexMetadata, () => {
  beforeEach(() => {
    getTopicIndexPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
    resolveIndexPageWith();
  });

  it('reads the index page the topic index renders', async () => {
    await buildTopicIndexMetadata();

    expect(getTopicIndexPageMock).toHaveBeenCalledWith();
  });

  it('builds metadata from the resolved seo, self-canonical to the topic index', async () => {
    const metadata = await buildTopicIndexMetadata();

    expect(metadata.title).toBe(title);
    expect(metadata.description).toBe(description);
    expect(metadata.alternates?.canonical).toBe(INDEX_PATH);
    expect(metadata.openGraph?.title).toBe(ogTitle);
    expect(metadata.openGraph?.description).toBe(ogDescription);
    expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the index page fetch fails', async () => {
      getTopicIndexPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildTopicIndexMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'topic_index_metadata.fetch_failed',
        { error: MOCK_ERROR },
      );
    });

    it('returns empty metadata without logging when there is no index page', async () => {
      getTopicIndexPageMock.mockResolvedValue(okResult());

      const metadata = await buildTopicIndexMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });

  it('lists each live translated language as hreflang, canonical to its prefix', async () => {
    vi.mocked(getRequestContext).mockResolvedValue(MOCK_DUTCH_REQUEST_CONTEXT);
    resolveIndexPageWith([EN, NL, DE]);

    const metadata = await buildTopicIndexMetadata();

    expect(metadata.alternates).toEqual({
      canonical: NL_TOPICS_INDEX_PATH,
      languages: {
        en: INDEX_PATH,
        nl: NL_TOPICS_INDEX_PATH,
        'x-default': INDEX_PATH,
      },
    });
  });
});
