import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES, routes } from '@shinefold/config';
import { type TTopicDetailPage } from '@shinefold/service';
import { errorResult, okResult } from '@shinefold/utils';
import { TOPIC_LOG } from '@web/constants/topic';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
  mockMetadataSeo,
  toPageSuffix,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_OG_IMAGE_URL } from '@web/testing/shared/seo/og-image-fixtures';
import { mockTopicDetailPage } from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';

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
const MOCK_MISSING_SLUG = faker.lorem.slug();
const NL_TOPIC_PATH = `${NL_PATH_PREFIX}${routes.topic(MOCK_NL_SLUG)}`;
const EN_TOPIC_PATH = routes.topic(MOCK_EN_SLUG);

const MOCK_SEO = mockMetadataSeo();
const { title, description, ogTitle, ogDescription } = MOCK_SEO;

const resolveTopicPageWith = (overrides: Partial<TTopicDetailPage> = {}) =>
  getTopicPageMock.mockResolvedValue(
    okResult(mockTopicDetailPage({ seo: MOCK_SEO, ...overrides })),
  );

describe(buildTopicMetadata, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
  });

  describe('when the topic resolves', () => {
    beforeEach(() => {
      resolveTopicPageWith();
    });

    it('reads the topic the topic page renders', async () => {
      await buildTopicMetadata(MOCK_TOPIC_SLUG);

      expect(getTopicPageMock).toHaveBeenCalledWith(MOCK_TOPIC_SLUG);
    });

    it('builds page-1 metadata from the seo, canonical to the topic', async () => {
      const metadata = await buildTopicMetadata(MOCK_TOPIC_SLUG);

      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(description);
      expect(metadata.alternates?.canonical).toBe(
        routes.topic(MOCK_TOPIC_SLUG),
      );
      expect(metadata.openGraph?.title).toBe(ogTitle);
      expect(metadata.openGraph?.description).toBe(ogDescription);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
    });

    it('suffixes page-N titles with the page, canonical to that page', async () => {
      const metadata = await buildTopicMetadata(MOCK_TOPIC_SLUG, 2);

      expect(metadata.title).toBe(`${title} ${toPageSuffix(2)}`);
      expect(metadata.alternates?.canonical).toBe(
        routes.topic(MOCK_TOPIC_SLUG, 2),
      );
    });
  });

  describe('when the topic fetch fails', () => {
    beforeEach(() => {
      getTopicPageMock.mockResolvedValue(errorResult(MOCK_ERROR));
    });

    it.each([
      { slug: MOCK_TOPIC_SLUG, page: undefined, scope: 'the first page' },
      { slug: MOCK_MISSING_SLUG, page: 2, scope: 'page 2' },
    ])('returns empty metadata and logs for $scope', async ({ slug, page }) => {
      const metadata = await buildTopicMetadata(slug, page);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        TOPIC_LOG.METADATA_FETCH_FAILED,
        { slug, error: MOCK_ERROR },
      );
    });
  });

  it('returns empty metadata without logging when no topic matches', async () => {
    getTopicPageMock.mockResolvedValue(okResult());

    const metadata = await buildTopicMetadata(MOCK_MISSING_SLUG);

    expect(metadata).toEqual({});
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  describe('for a Dutch-language request', () => {
    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue(
        MOCK_DUTCH_REQUEST_CONTEXT,
      );
      resolveTopicPageWith({
        translations: [
          { language: EN, slug: MOCK_EN_SLUG },
          { language: NL, slug: MOCK_NL_SLUG },
          { language: DE, slug: MOCK_DE_SLUG },
        ],
      });
    });

    it('lists each live translation as hreflang, canonical to its prefix', async () => {
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
});
