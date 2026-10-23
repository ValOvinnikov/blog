import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  LANDING_PAGE_OG_IMAGE,
  mockLandingPage,
} from '@web/testing/pages/landing-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildLandingPageMetadata } from './build-landing-page-metadata';

const { getLandingPageMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
}));

vi.mock('@web/server/landing/get-landing-page/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const FAQ_PATH = 'modules/faq';
const NL_FAQ_PATH = 'modules/vragen';
const MISSING_PATH = 'missing';

const { path: LANDING_PATH, seo: LANDING_SEO } = mockLandingPage;

const { EN, NL } = LOCALE_ISO_CODES;

describe(buildLandingPageMetadata, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      liveLocales: [EN, NL],
    });
  });

  it('lists each translation under its full nested path, canonical to its own', async () => {
    getLandingPageMock.mockResolvedValue(
      okResult({
        ...mockLandingPage,
        path: FAQ_PATH,
        translations: [
          { language: EN, slug: FAQ_PATH },
          { language: NL, slug: NL_FAQ_PATH },
        ],
      }),
    );

    const metadata = await buildLandingPageMetadata(FAQ_PATH);

    expect(metadata.alternates).toEqual({
      canonical: routes.landingPage(FAQ_PATH),
      languages: {
        en: routes.landingPage(FAQ_PATH),
        nl: `/nl${routes.landingPage(NL_FAQ_PATH)}`,
        'x-default': routes.landingPage(FAQ_PATH),
      },
    });
  });

  describe('for a page with the default fixture', () => {
    beforeEach(() => {
      getLandingPageMock.mockResolvedValue(okResult(mockLandingPage));
    });

    it('forwards the path to getLandingPage, the loader LandingPage reads', async () => {
      await buildLandingPageMetadata(LANDING_PATH);

      expect(getLandingPageMock).toHaveBeenCalledWith(LANDING_PATH);
    });

    it('maps the resolved seo through toMetadata, self-canonical to its path', async () => {
      const { title, description, ogTitle, ogDescription } = LANDING_SEO;

      const metadata = await buildLandingPageMetadata(LANDING_PATH);

      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(description);
      expect(metadata.alternates?.canonical).toBe(
        routes.landingPage(LANDING_PATH),
      );
      expect(metadata.openGraph?.title).toBe(ogTitle);
      expect(metadata.openGraph?.description).toBe(ogDescription);
      expect(metadata.openGraph?.images).toEqual([
        {
          url: urlForSanityImage(
            LANDING_PAGE_OG_IMAGE,
            MOCK_TENANT_SANITY_CONTEXT,
          ),
        },
      ]);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the page fetch fails', async () => {
      getLandingPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildLandingPageMetadata(MISSING_PATH);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'landing_page_metadata.fetch_failed',
        { path: MISSING_PATH, error: MOCK_ERROR },
      );
    });

    it('returns empty metadata without logging when the page simply does not exist', async () => {
      getLandingPageMock.mockResolvedValue(okResult());

      const metadata = await buildLandingPageMetadata(MISSING_PATH);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });
});
