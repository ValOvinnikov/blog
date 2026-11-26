import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES, routes } from '@shinefold/config';
import { type TTagDetailPage } from '@shinefold/service';
import { okResult } from '@shinefold/utils';
import { TAG_LOG } from '@web/constants/tag';
import { getRequestContext } from '@web/server/request-context/request-context';
import { testMetadataLoaderFailures } from '@web/testing/metadata/metadata-loader-contract/metadata-loader-contract';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
  mockMetadataSeo,
} from '@web/testing/metadata/to-metadata/fixtures';
import {
  MOCK_TAG_SLUG,
  mockTagDetailPage,
} from '@web/testing/shared/tag/fixtures';

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
const NL_TAG_PATH = `${NL_PATH_PREFIX}${routes.tag(MOCK_NL_SLUG)}`;
const EN_TAG_PATH = routes.tag(MOCK_EN_SLUG);
const TAG_FEED_TYPES = {
  'application/rss+xml': routes.tagRssFeed(MOCK_TAG_SLUG),
};

const MOCK_SEO = mockMetadataSeo();

const resolveTagPageWith = (overrides: Partial<TTagDetailPage> = {}) =>
  getTagPageMock.mockResolvedValue(
    okResult(mockTagDetailPage({ seo: MOCK_SEO, ...overrides })),
  );

describe(buildTagMetadata, () => {
  beforeEach(() => {
    resolveTagPageWith();
  });

  it('reads the tag the tag page renders', async () => {
    await buildTagMetadata(MOCK_TAG_SLUG);

    expect(getTagPageMock).toHaveBeenCalledWith(MOCK_TAG_SLUG);
  });

  it('builds the metadata from the tag seo', async () => {
    const metadata = await buildTagMetadata(MOCK_TAG_SLUG);

    expect(metadata.title).toBe(MOCK_SEO.title);
  });

  it.each([
    { page: undefined, canonical: routes.tag(MOCK_TAG_SLUG) },
    { page: 2, canonical: routes.tag(MOCK_TAG_SLUG, 2) },
  ])(
    'canonicalises page $page to that page of the tag with its feed',
    async ({ page, canonical }) => {
      const metadata = await buildTagMetadata(MOCK_TAG_SLUG, page);

      expect(metadata.alternates?.canonical).toBe(canonical);
      expect(metadata.alternates?.types).toEqual(TAG_FEED_TYPES);
    },
  );

  testMetadataLoaderFailures({
    pageLoaderMock: getTagPageMock,
    buildMetadata: () => buildTagMetadata(MOCK_TAG_SLUG),
    logEvent: TAG_LOG.METADATA_FETCH_FAILED,
    logContext: { slug: MOCK_TAG_SLUG },
  });

  it('lists each live translation as hreflang and the feed in its own language', async () => {
    vi.mocked(getRequestContext).mockResolvedValue(MOCK_DUTCH_REQUEST_CONTEXT);
    resolveTagPageWith({
      translations: [
        { language: EN, slug: MOCK_EN_SLUG },
        { language: NL, slug: MOCK_NL_SLUG },
        { language: DE, slug: MOCK_DE_SLUG },
      ],
    });

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
