import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { type TTagDetailPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_OG_IMAGE,
  MOCK_OG_IMAGE_URL,
} from '@web/testing/shared/seo/og-image-fixtures';
import {
  MOCK_TAG_SLUG,
  mockTagDetailPage,
} from '@web/testing/shared/tag/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTagMetadata } from './build-tag-metadata';

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@web/server/tag/get-tag-page/get-tag-page', () => ({
  getTagPage: getTagPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const TITLE = 'TypeScript';
const EN_DESIGN_SLUG = 'design';
const NL_SLUG = 'ontwerp';
const DESCRIPTION = 'Posts about TypeScript.';
const TAG_FEED_TYPES = {
  'application/rss+xml': routes.tagRssFeed(MOCK_TAG_SLUG),
};
const PAGE_TWO_TITLE = `${TITLE} – Page 2`;
const NL_DESIGN_TAG_PATH = `/nl${routes.tag(NL_SLUG)}`;
const EN_DESIGN_TAG_PATH = routes.tag(EN_DESIGN_SLUG);

const seo = mockSeo({
  title: TITLE,
  description: DESCRIPTION,
  ogTitle: TITLE,
  ogDescription: DESCRIPTION,
  ogImage: MOCK_OG_IMAGE,
});

const resolveTagPageWith = (overrides: Partial<TTagDetailPage>) =>
  getTagPageMock.mockResolvedValue(okResult(mockTagDetailPage(overrides)));

describe(buildTagMetadata, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
    resolveTagPageWith({ seo });
  });

  it('reads the same tag the tag page renders', async () => {
    await buildTagMetadata(MOCK_TAG_SLUG);

    expect(getTagPageMock).toHaveBeenCalledWith(MOCK_TAG_SLUG);
  });

  it('builds page-1 metadata from the seo, canonical to the tag', async () => {
    const metadata = await buildTagMetadata(MOCK_TAG_SLUG);

    expect(metadata.title).toBe(TITLE);
    expect(metadata.description).toBe(DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe(routes.tag(MOCK_TAG_SLUG));
    expect(metadata.alternates?.types).toEqual(TAG_FEED_TYPES);
    expect(metadata.openGraph?.title).toBe(TITLE);
    expect(metadata.openGraph?.description).toBe(DESCRIPTION);
    expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
  });

  it('suffixes page-N titles with the page, canonical to that page', async () => {
    const metadata = await buildTagMetadata(MOCK_TAG_SLUG, 2);

    expect(metadata.title).toBe(PAGE_TWO_TITLE);
    expect(metadata.openGraph?.title).toBe(PAGE_TWO_TITLE);
    expect(metadata.alternates?.canonical).toBe(routes.tag(MOCK_TAG_SLUG, 2));
    expect(metadata.alternates?.types).toEqual(TAG_FEED_TYPES);
  });

  it('omits the OG title past page 1 when none is authored', async () => {
    resolveTagPageWith({ seo: mockSeo({ ogTitle: undefined }) });

    const metadata = await buildTagMetadata(MOCK_TAG_SLUG, 2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });

  describe('when the tag fetch fails', () => {
    beforeEach(() => {
      getTagPageMock.mockResolvedValue(errorResult(MOCK_ERROR));
    });

    it.each([
      { slug: MOCK_TAG_SLUG, page: undefined, scope: 'the first page' },
      { slug: 'missing', page: 2, scope: 'page 2' },
    ])(
      'returns empty metadata on $scope when the fetch fails',
      async ({ slug, page }) => {
        const metadata = await buildTagMetadata(slug, page);

        expect(metadata).toEqual({});
      },
    );
  });

  it('returns empty metadata without logging when no tag matches', async () => {
    getTagPageMock.mockResolvedValue(okResult());

    const metadata = await buildTagMetadata('missing');

    expect(metadata).toEqual({});
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  describe('for a Dutch-language request', () => {
    const { EN, NL, DE } = LOCALE_ISO_CODES;

    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...MOCK_REQUEST_CONTEXT,
        locale: NL,
        liveLocales: [EN, NL],
      });
      resolveTagPageWith({
        seo,
        translations: [
          { language: EN, slug: EN_DESIGN_SLUG },
          { language: NL, slug: NL_SLUG },
          { language: DE, slug: 'gestaltung' },
        ],
      });
    });

    it('advertises the feed in its own language', async () => {
      const metadata = await buildTagMetadata(NL_SLUG);

      expect(metadata.alternates?.types).toEqual({
        'application/rss+xml': `/nl${routes.tagRssFeed(NL_SLUG)}`,
      });
    });

    it('lists each live translation as hreflang, canonical to its prefix', async () => {
      const metadata = await buildTagMetadata(NL_SLUG);

      expect(metadata.alternates?.canonical).toBe(NL_DESIGN_TAG_PATH);
      expect(metadata.alternates?.languages).toEqual({
        en: EN_DESIGN_TAG_PATH,
        nl: NL_DESIGN_TAG_PATH,
        'x-default': EN_DESIGN_TAG_PATH,
      });
    });

    it('lists no hreflang past page 1', async () => {
      const metadata = await buildTagMetadata(NL_SLUG, 2);

      expect(metadata.alternates?.canonical).toBe(
        `/nl${routes.tag(NL_SLUG, 2)}`,
      );
      expect(metadata.alternates?.languages).toBeUndefined();
    });
  });
});
