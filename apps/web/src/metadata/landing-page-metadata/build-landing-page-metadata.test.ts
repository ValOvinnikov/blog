import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_BILINGUAL_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
} from '@web/testing/metadata/to-metadata/fixtures';
import {
  MOCK_LANDING_PAGE,
  MOCK_LANDING_PAGE_OG_IMAGE,
} from '@web/testing/pages/landing-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildLandingPageMetadata } from './build-landing-page-metadata';

const { getLandingPageMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
}));

vi.mock('@web/server/landing/get-landing-page/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(5203);

const MOCK_FAQ_PATH = `${faker.lorem.slug()}/${faker.lorem.slug()}`;
const MOCK_NL_FAQ_PATH = `${faker.lorem.slug()}/${faker.lorem.slug()}`;
const MOCK_MISSING_PATH = faker.lorem.slug();

const { path: LANDING_PATH, seo: LANDING_SEO } = MOCK_LANDING_PAGE;

const { EN, NL } = LOCALE_ISO_CODES;

describe(buildLandingPageMetadata, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(
      MOCK_BILINGUAL_REQUEST_CONTEXT,
    );
  });

  it('lists each translation under its full nested path, canonical to its own', async () => {
    getLandingPageMock.mockResolvedValue(
      okResult({
        ...MOCK_LANDING_PAGE,
        path: MOCK_FAQ_PATH,
        translations: [
          { language: EN, slug: MOCK_FAQ_PATH },
          { language: NL, slug: MOCK_NL_FAQ_PATH },
        ],
      }),
    );

    const metadata = await buildLandingPageMetadata(MOCK_FAQ_PATH);

    expect(metadata.alternates).toEqual({
      canonical: routes.landingPage(MOCK_FAQ_PATH),
      languages: {
        en: routes.landingPage(MOCK_FAQ_PATH),
        nl: `${NL_PATH_PREFIX}${routes.landingPage(MOCK_NL_FAQ_PATH)}`,
        'x-default': routes.landingPage(MOCK_FAQ_PATH),
      },
    });
  });

  describe('for a page with the default fixture', () => {
    beforeEach(() => {
      getLandingPageMock.mockResolvedValue(okResult(MOCK_LANDING_PAGE));
    });

    it('reads the page at the requested path', async () => {
      await buildLandingPageMetadata(LANDING_PATH);

      expect(getLandingPageMock).toHaveBeenCalledWith(LANDING_PATH);
    });

    it('maps the resolved seo, self-canonical to its path', async () => {
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
            MOCK_LANDING_PAGE_OG_IMAGE,
            MOCK_TENANT_SANITY_CONTEXT,
          ),
        },
      ]);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the page fetch fails', async () => {
      getLandingPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildLandingPageMetadata(MOCK_MISSING_PATH);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'landing_page_metadata.fetch_failed',
        { path: MOCK_MISSING_PATH, error: MOCK_ERROR },
      );
    });

    it('returns empty metadata without logging when the page does not exist', async () => {
      getLandingPageMock.mockResolvedValue(okResult());

      const metadata = await buildLandingPageMetadata(MOCK_MISSING_PATH);

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });
});
