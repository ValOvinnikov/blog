import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES, routes } from '@shinefold/config';
import { type TTopicDetailPage } from '@shinefold/service';
import { okResult } from '@shinefold/utils';
import { TOPIC_LOG } from '@web/constants/topic';
import { getRequestContext } from '@web/server/request-context/request-context';
import { testMetadataLoaderFailures } from '@web/testing/metadata/metadata-loader-contract/metadata-loader-contract';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
  mockMetadataSeo,
} from '@web/testing/metadata/to-metadata/fixtures';
import { mockTopicDetailPage } from '@web/testing/shared/topic/fixtures';

import { buildTopicMetadata } from './build-topic-metadata';

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/server/topic/get-topic-page/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(5209);

const { EN, NL, DE } = LOCALE_ISO_CODES;
const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_EN_SLUG = faker.lorem.slug();
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_DE_SLUG = faker.lorem.slug();
const NL_TOPIC_PATH = `${NL_PATH_PREFIX}${routes.topic(MOCK_NL_SLUG)}`;
const EN_TOPIC_PATH = routes.topic(MOCK_EN_SLUG);

const MOCK_SEO = mockMetadataSeo();

const resolveTopicPageWith = (overrides: Partial<TTopicDetailPage> = {}) =>
  getTopicPageMock.mockResolvedValue(
    okResult(mockTopicDetailPage({ seo: MOCK_SEO, ...overrides })),
  );

describe(buildTopicMetadata, () => {
  beforeEach(() => {
    resolveTopicPageWith();
  });

  it('reads the topic the topic page renders', async () => {
    await buildTopicMetadata(MOCK_TOPIC_SLUG);

    expect(getTopicPageMock).toHaveBeenCalledWith(MOCK_TOPIC_SLUG);
  });

  it('builds the metadata from the topic seo', async () => {
    const metadata = await buildTopicMetadata(MOCK_TOPIC_SLUG);

    expect(metadata.title).toBe(MOCK_SEO.title);
  });

  it.each([
    {
      scope: 'the first page',
      page: undefined,
      canonical: routes.topic(MOCK_TOPIC_SLUG),
    },
    { scope: 'page 2', page: 2, canonical: routes.topic(MOCK_TOPIC_SLUG, 2) },
  ])(
    'canonicalises $scope to that page of the topic',
    async ({ page, canonical }) => {
      const metadata = await buildTopicMetadata(MOCK_TOPIC_SLUG, page);

      expect(metadata.alternates?.canonical).toBe(canonical);
    },
  );

  testMetadataLoaderFailures({
    pageLoaderMock: getTopicPageMock,
    buildMetadata: () => buildTopicMetadata(MOCK_TOPIC_SLUG),
    logEvent: TOPIC_LOG.METADATA_FETCH_FAILED,
    logContext: { slug: MOCK_TOPIC_SLUG },
  });

  it('lists each live translation as hreflang, canonical to its prefix', async () => {
    vi.mocked(getRequestContext).mockResolvedValue(MOCK_DUTCH_REQUEST_CONTEXT);
    resolveTopicPageWith({
      translations: [
        { language: EN, slug: MOCK_EN_SLUG },
        { language: NL, slug: MOCK_NL_SLUG },
        { language: DE, slug: MOCK_DE_SLUG },
      ],
    });

    const metadata = await buildTopicMetadata(MOCK_NL_SLUG);

    expect(metadata.alternates).toEqual({
      canonical: NL_TOPIC_PATH,
      languages: {
        en: EN_TOPIC_PATH,
        nl: NL_TOPIC_PATH,
        'x-default': EN_TOPIC_PATH,
      },
    });
  });
});
