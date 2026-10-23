import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
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

const ogImage = mockSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  MOCK_TENANT_SANITY_CONTEXT,
);

const DESCRIPTION = 'Browse every post by topic.';
const OG_DESCRIPTION = 'Browse every post by topic OG.';
const NL_TOPICS_PATH = '/nl/topics';

const seo = mockSeo({
  title: 'Topics',
  description: DESCRIPTION,
  ogTitle: 'Topics OG',
  ogDescription: OG_DESCRIPTION,
  ogImage,
});

const resolveIndexPageWith = (
  translations: TLocaleIsoCode[] = [LOCALE_ISO_CODES.EN],
) =>
  getTopicIndexPageMock.mockResolvedValue(
    okResult({
      headingBlock: { heading: 'Topics' },
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

      expect(metadata.title).toBe('Topics');
      expect(metadata.description).toBe(DESCRIPTION);
      expect(metadata.alternates?.canonical).toBe('/topics');
      expect(metadata.openGraph?.title).toBe('Topics OG');
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([
        { url: EXPECTED_OG_IMAGE_URL },
      ]);
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

    expect(metadata.alternates).toMatchObject({
      canonical: NL_TOPICS_PATH,
      languages: { en: '/topics', nl: NL_TOPICS_PATH, 'x-default': '/topics' },
    });
  });
});
