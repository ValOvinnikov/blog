import { LOCALE_ISO_CODES, routes, type TLocaleIsoCode } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_OG_IMAGE,
  MOCK_OG_IMAGE_URL,
} from '@web/testing/shared/seo/og-image-fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
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

const TITLE = 'Topics';
const INDEX_PATH = routes.topics();
const NL_INDEX_PATH = `/nl${INDEX_PATH}`;
const DESCRIPTION = 'Browse every post by topic.';
const OG_DESCRIPTION = 'Browse every post by topic OG.';

const seo = mockSeo({
  title: TITLE,
  description: DESCRIPTION,
  ogTitle: 'Topics OG',
  ogDescription: OG_DESCRIPTION,
  ogImage: MOCK_OG_IMAGE,
});

const resolveIndexPageWith = (
  translations: TLocaleIsoCode[] = [LOCALE_ISO_CODES.EN],
) =>
  getTopicIndexPageMock.mockResolvedValue(
    okResult({
      headingBlock: { heading: TITLE },
      seo,
      modules: [],
      translations,
    }),
  );

describe(buildTopicIndexMetadata, () => {
  beforeEach(() => {
    getTopicIndexPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
  });

  describe('when the index page resolves', () => {
    beforeEach(() => {
      resolveIndexPageWith();
    });

    it('reads the same index page the topic index renders', async () => {
      await buildTopicIndexMetadata();

      expect(getTopicIndexPageMock).toHaveBeenCalledWith();
    });

    it('builds metadata from the resolved seo, self-canonical to /topics', async () => {
      const metadata = await buildTopicIndexMetadata();

      expect(metadata.title).toBe(TITLE);
      expect(metadata.description).toBe(DESCRIPTION);
      expect(metadata.alternates?.canonical).toBe(INDEX_PATH);
      expect(metadata.openGraph?.title).toBe('Topics OG');
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
    });
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
    const { EN, NL, DE } = LOCALE_ISO_CODES;
    const translations = [EN, NL, DE];
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });
    resolveIndexPageWith(translations);

    const metadata = await buildTopicIndexMetadata();

    expect(metadata.alternates).toEqual({
      canonical: NL_INDEX_PATH,
      languages: {
        en: INDEX_PATH,
        nl: NL_INDEX_PATH,
        'x-default': INDEX_PATH,
      },
    });
  });
});
