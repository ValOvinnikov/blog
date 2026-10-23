import { LOCALE_ISO_CODES } from '@blog/config';
import { type TTagDetailPage, urlForSanityImage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import { mockTagDetailPage } from '@web/testing/shared/tag/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildTagMetadata } from './build-tag-metadata';

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@web/server/tag/get-tag-page/get-tag-page', () => ({
  getTagPage: getTagPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const ogImage = mockSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  MOCK_TENANT_SANITY_CONTEXT,
);

const DESCRIPTION = 'Posts about TypeScript.';
const TAG_PATH = '/tags/typescript';
const TAG_FEED_PATH = '/tags/typescript/rss.xml';
const PAGE_TWO_TITLE = 'TypeScript – Page 2';
const NL_DESIGN_TAG_PATH = '/nl/tags/ontwerp';
const EN_DESIGN_TAG_PATH = '/tags/design';

const seo = mockSeo({
  title: 'TypeScript',
  description: DESCRIPTION,
  ogTitle: 'TypeScript',
  ogDescription: DESCRIPTION,
  ogImage,
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
    await buildTagMetadata('typescript');

    expect(getTagPageMock).toHaveBeenCalledWith('typescript');
  });

  it('builds page-1 metadata from the seo, canonical to the tag', async () => {
    const metadata = await buildTagMetadata('typescript');

    expect(metadata.title).toBe('TypeScript');
    expect(metadata.description).toBe(DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe(TAG_PATH);
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': TAG_FEED_PATH,
    });
    expect(metadata.openGraph?.title).toBe('TypeScript');
    expect(metadata.openGraph?.description).toBe(DESCRIPTION);
    expect(metadata.openGraph?.images).toEqual([
      { url: EXPECTED_OG_IMAGE_URL },
    ]);
  });

  it('suffixes page-N titles with the page, canonical to that page', async () => {
    const metadata = await buildTagMetadata('typescript', 2);

    expect(metadata.title).toBe(PAGE_TWO_TITLE);
    expect(metadata.openGraph?.title).toBe(PAGE_TWO_TITLE);
    expect(metadata.alternates?.canonical).toBe('/tags/typescript/page/2');
    expect(metadata.alternates?.canonical).not.toBe(TAG_PATH);
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': TAG_FEED_PATH,
    });
  });

  it('omits the OG title past page 1 when none is authored', async () => {
    resolveTagPageWith({ seo: mockSeo({ ogTitle: undefined }) });

    const metadata = await buildTagMetadata('typescript', 2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });

  describe('when the tag fetch fails', () => {
    beforeEach(() => {
      getTagPageMock.mockResolvedValue(errorResult(MOCK_ERROR));
    });

    it.each([
      { slug: 'typescript', page: undefined, scope: 'the first page' },
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
          { language: EN, slug: 'design' },
          { language: NL, slug: 'ontwerp' },
          { language: DE, slug: 'gestaltung' },
        ],
      });
    });

    it('advertises the feed in its own language', async () => {
      const metadata = await buildTagMetadata('ontwerp');

      expect(metadata.alternates?.types).toEqual({
        'application/rss+xml': '/nl/tags/ontwerp/rss.xml',
      });
    });

    it('lists each live translation as hreflang, canonical to its prefix', async () => {
      const metadata = await buildTagMetadata('ontwerp');

      expect(metadata.alternates).toMatchObject({
        canonical: NL_DESIGN_TAG_PATH,
        languages: {
          en: EN_DESIGN_TAG_PATH,
          nl: NL_DESIGN_TAG_PATH,
          'x-default': EN_DESIGN_TAG_PATH,
        },
      });
    });

    it('lists no hreflang past page 1', async () => {
      const metadata = await buildTagMetadata('ontwerp', 2);

      expect(metadata.alternates?.canonical).toBe('/nl/tags/ontwerp/page/2');
      expect(metadata.alternates?.languages).toBeUndefined();
    });
  });
});
