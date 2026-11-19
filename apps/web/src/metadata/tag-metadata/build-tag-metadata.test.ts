import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES, routes } from '@shinefold/config';
import { type TTagDetailPage } from '@shinefold/service';
import { errorResult, okResult } from '@shinefold/utils';
import { TAG_LOG } from '@web/constants/tag';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
  mockMetadataSeo,
  toPageSuffix,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_OG_IMAGE_URL } from '@web/testing/shared/seo/og-image-fixtures';
import {
  MOCK_TAG_SLUG,
  mockTagDetailPage,
} from '@web/testing/shared/tag/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTagMetadata } from './build-tag-metadata';

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@web/server/tag/get-tag-page/get-tag-page', () => ({
  getTagPage: getTagPageMock,
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(5208);

const { EN, NL, DE } = LOCALE_ISO_CODES;
const MOCK_EN_SLUG = faker.lorem.slug();
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_DE_SLUG = faker.lorem.slug();
const MOCK_MISSING_SLUG = faker.lorem.slug();
const NL_TAG_PATH = `${NL_PATH_PREFIX}${routes.tag(MOCK_NL_SLUG)}`;
const EN_TAG_PATH = routes.tag(MOCK_EN_SLUG);
const TAG_FEED_TYPES = {
  'application/rss+xml': routes.tagRssFeed(MOCK_TAG_SLUG),
};

const MOCK_SEO = mockMetadataSeo();
const { title, description, ogTitle, ogDescription } = MOCK_SEO;

const resolveTagPageWith = (overrides: Partial<TTagDetailPage>) =>
  getTagPageMock.mockResolvedValue(okResult(mockTagDetailPage(overrides)));

describe(buildTagMetadata, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
    resolveTagPageWith({ seo: MOCK_SEO });
  });

  it('reads the tag the tag page renders', async () => {
    await buildTagMetadata(MOCK_TAG_SLUG);

    expect(getTagPageMock).toHaveBeenCalledWith(MOCK_TAG_SLUG);
  });

  it('builds page-1 metadata from the seo, canonical to the tag', async () => {
    const metadata = await buildTagMetadata(MOCK_TAG_SLUG);

    expect(metadata.title).toBe(title);
    expect(metadata.description).toBe(description);
    expect(metadata.alternates?.canonical).toBe(routes.tag(MOCK_TAG_SLUG));
    expect(metadata.alternates?.types).toEqual(TAG_FEED_TYPES);
    expect(metadata.openGraph?.title).toBe(ogTitle);
    expect(metadata.openGraph?.description).toBe(ogDescription);
    expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
  });

  it('suffixes page-N titles with the page, canonical to that page', async () => {
    const metadata = await buildTagMetadata(MOCK_TAG_SLUG, 2);

    expect(metadata.title).toBe(`${title} ${toPageSuffix(2)}`);
    expect(metadata.alternates?.canonical).toBe(routes.tag(MOCK_TAG_SLUG, 2));
    expect(metadata.alternates?.types).toEqual(TAG_FEED_TYPES);
  });

  describe('when the tag fetch fails', () => {
    beforeEach(() => {
      getTagPageMock.mockResolvedValue(errorResult(MOCK_ERROR));
    });

    it.each([
      { slug: MOCK_TAG_SLUG, page: undefined, scope: 'the first page' },
      { slug: MOCK_MISSING_SLUG, page: 2, scope: 'page 2' },
    ])('returns empty metadata and logs for $scope', async ({ slug, page }) => {
      const metadata = await buildTagMetadata(slug, page);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        TAG_LOG.METADATA_FETCH_FAILED,
        { slug, error: MOCK_ERROR },
      );
    });
  });

  it('returns empty metadata without logging when no tag matches', async () => {
    getTagPageMock.mockResolvedValue(okResult());

    const metadata = await buildTagMetadata(MOCK_MISSING_SLUG);

    expect(metadata).toEqual({});
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  describe('for a Dutch-language request', () => {
    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue(
        MOCK_DUTCH_REQUEST_CONTEXT,
      );
      resolveTagPageWith({
        seo: MOCK_SEO,
        translations: [
          { language: EN, slug: MOCK_EN_SLUG },
          { language: NL, slug: MOCK_NL_SLUG },
          { language: DE, slug: MOCK_DE_SLUG },
        ],
      });
    });

    it('lists each live translation as hreflang and the feed in its own language', async () => {
      const metadata = await buildTagMetadata(MOCK_NL_SLUG);

      expect(metadata.alternates).toEqual({
        canonical: NL_TAG_PATH,
        languages: {
          en: EN_TAG_PATH,
          nl: NL_TAG_PATH,
          'x-default': EN_TAG_PATH,
        },
        types: {
          'application/rss+xml': `${NL_PATH_PREFIX}${routes.tagRssFeed(MOCK_NL_SLUG)}`,
        },
      });
    });
  });
});
