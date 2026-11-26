import { faker } from '@faker-js/faker';
import {
  LOCALE_ISO_CODES,
  routes,
  type TLocaleIsoCode,
} from '@shinefold/config';
import { okResult } from '@shinefold/utils';
import { TOPIC_INDEX_LOG } from '@web/constants/topic-index';
import { getRequestContext } from '@web/server/request-context/request-context';
import { NL_TOPICS_INDEX_PATH } from '@web/testing/metadata/index-paths/fixtures';
import { testMetadataLoaderFailures } from '@web/testing/metadata/metadata-loader-contract/metadata-loader-contract';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  mockMetadataSeo,
} from '@web/testing/metadata/to-metadata/fixtures';
import { mockIndexPage } from '@web/testing/pages/index-page/fixtures';

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

const resolveIndexPageWith = (translations: TLocaleIsoCode[] = [EN]) =>
  getTopicIndexPageMock.mockResolvedValue(
    okResult(mockIndexPage({ seo: MOCK_SEO, translations })),
  );

describe(buildTopicIndexMetadata, () => {
  beforeEach(() => {
    resolveIndexPageWith();
  });

  it('reads the index page the topic index renders', async () => {
    await buildTopicIndexMetadata();

    expect(getTopicIndexPageMock).toHaveBeenCalledWith();
  });

  it('builds metadata from the resolved seo, self-canonical to the topic index', async () => {
    const metadata = await buildTopicIndexMetadata();

    expect(metadata.title).toBe(MOCK_SEO.title);
    expect(metadata.alternates?.canonical).toBe(INDEX_PATH);
  });

  testMetadataLoaderFailures({
    pageLoaderMock: getTopicIndexPageMock,
    buildMetadata: buildTopicIndexMetadata,
    logEvent: TOPIC_INDEX_LOG.METADATA_FETCH_FAILED,
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
