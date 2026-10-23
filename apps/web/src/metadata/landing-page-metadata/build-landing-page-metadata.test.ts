import { LOCALE_ISO_CODES } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  LANDING_PAGE_OG_IMAGE,
  mockLandingPage,
} from '@web/testing/pages/landing-page/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
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

const FAQ_SLUG = 'modules/faq';
const NL_ABOUT_PATH = '/nl/over-ons';
const NL_ABOUT_SLUG = 'over-ons';

const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  LANDING_PAGE_OG_IMAGE,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const { EN, NL, DE } = LOCALE_ISO_CODES;

describe('buildLandingPageMetadata', () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      liveLocales: [EN, NL],
    });
  });

  it('adds no languages when the only translation is the page itself', async () => {
    getLandingPageMock.mockResolvedValue(
      okResult({
        ...mockLandingPage,
        translations: [{ language: EN, slug: 'about-us' }],
      }),
    );

    const metadata = await buildLandingPageMetadata('about-us');

    expect(metadata.alternates).toEqual({ canonical: '/about-us' });
  });

  it('uses the full path of a nested page for its canonical and hreflang', async () => {
    getLandingPageMock.mockResolvedValue(
      okResult({
        ...mockLandingPage,
        path: FAQ_SLUG,
        translations: [
          { language: EN, slug: FAQ_SLUG },
          { language: NL, slug: 'modules/vragen' },
        ],
      }),
    );

    const metadata = await buildLandingPageMetadata(FAQ_SLUG);

    expect(metadata.alternates?.canonical).toBe('/modules/faq');
    expect(metadata.alternates?.languages).toMatchObject({
      nl: '/nl/modules/vragen',
    });
  });

  it('leaves a non-live translation out of the hreflang list', async () => {
    getLandingPageMock.mockResolvedValue(
      okResult({
        ...mockLandingPage,
        translations: [
          { language: EN, slug: 'about-us' },
          { language: NL, slug: NL_ABOUT_SLUG },
          { language: DE, slug: 'ueber-uns' },
        ],
      }),
    );

    const metadata = await buildLandingPageMetadata('about-us');

    expect(metadata.alternates?.languages).toEqual({
      en: '/about-us',
      nl: NL_ABOUT_PATH,
      'x-default': '/about-us',
    });
  });

  it('adds no languages when the only other translation is non-live', async () => {
    getLandingPageMock.mockResolvedValue(
      okResult({
        ...mockLandingPage,
        translations: [
          { language: EN, slug: 'about-us' },
          { language: DE, slug: 'ueber-uns' },
        ],
      }),
    );

    const metadata = await buildLandingPageMetadata('about-us');

    expect(metadata.alternates).toEqual({ canonical: '/about-us' });
  });

  it('omits x-default when no translation exists in the default language', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      liveLocales: [EN, NL, DE],
    });
    getLandingPageMock.mockResolvedValue(
      okResult({
        ...mockLandingPage,
        translations: [
          { language: NL, slug: NL_ABOUT_SLUG },
          { language: DE, slug: 'ueber-uns' },
        ],
      }),
    );

    const metadata = await buildLandingPageMetadata(NL_ABOUT_SLUG);

    expect(metadata.alternates?.languages).toEqual({
      nl: NL_ABOUT_PATH,
      de: '/de/ueber-uns',
    });
  });

  describe('for a page with an EN and a live NL translation', () => {
    beforeEach(() => {
      getLandingPageMock.mockResolvedValue(
        okResult({
          ...mockLandingPage,
          translations: [
            { language: EN, slug: 'about-us' },
            { language: NL, slug: NL_ABOUT_SLUG },
          ],
        }),
      );
    });

    it('treats only the current language as live when the tenant has no live list', async () => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...DEFAULT_REQUEST_CONTEXT,
        liveLocales: undefined,
      });

      const metadata = await buildLandingPageMetadata('about-us');

      expect(metadata.alternates).toEqual({ canonical: '/about-us' });
    });

    it('lists every translation as hreflang with x-default on the default language', async () => {
      const metadata = await buildLandingPageMetadata('about-us');

      expect(metadata.alternates).toEqual({
        canonical: '/about-us',
        languages: {
          en: '/about-us',
          nl: NL_ABOUT_PATH,
          'x-default': '/about-us',
        },
      });
    });

    it('emits locale, alternate locale and url for an EN page with a live NL translation', async () => {
      const metadata = await buildLandingPageMetadata('about-us');

      expect(metadata.openGraph?.locale).toBe('en_US');
      expect(metadata.openGraph?.alternateLocale).toEqual(['nl_NL']);
      expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    });
  });

  describe('for a page with no translations', () => {
    beforeEach(() => {
      getLandingPageMock.mockResolvedValue(
        okResult({ ...mockLandingPage, translations: [] }),
      );
    });

    it('leaves the alternates without languages for a page with no translations', async () => {
      const metadata = await buildLandingPageMetadata('about-us');

      expect(metadata.alternates).toEqual({ canonical: '/about-us' });
    });

    it('emits only locale and url, with no alternate locale, for a page with no translation', async () => {
      const metadata = await buildLandingPageMetadata('about-us');

      expect(metadata.openGraph?.locale).toBe('en_US');
      expect(metadata.openGraph?.alternateLocale).toBeUndefined();
      expect(metadata.openGraph?.url).toBe('/about-us');
    });
  });

  describe('for a page with the default fixture', () => {
    beforeEach(() => {
      getLandingPageMock.mockResolvedValue(okResult(mockLandingPage));
    });

    it('forwards the path to getLandingPage, the loader LandingPage reads', async () => {
      await buildLandingPageMetadata('about-us');

      expect(getLandingPageMock).toHaveBeenCalledWith('about-us');
    });

    it('maps the resolved seo straight through toMetadata, self-canonical to its path', async () => {
      const metadata = await buildLandingPageMetadata('about-us');

      expect(metadata.title).toBe('About Us');
      expect(metadata.description).toBe('Who we are.');
      expect(metadata.alternates?.canonical).toBe('/about-us');
      expect(metadata.openGraph?.title).toBe('About Us OG');
      expect(metadata.openGraph?.description).toBe('Who we are OG.');
      expect(metadata.openGraph?.images).toEqual([
        { url: EXPECTED_OG_IMAGE_URL },
      ]);
    });
  });

  describe('for the Dutch translation of a page', () => {
    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...DEFAULT_REQUEST_CONTEXT,
        locale: NL,
        liveLocales: [EN, NL],
      });
      getLandingPageMock.mockResolvedValue(
        okResult({
          ...mockLandingPage,
          slug: NL_ABOUT_SLUG,
          translations: [
            { language: EN, slug: 'about-us' },
            { language: NL, slug: NL_ABOUT_SLUG },
          ],
        }),
      );
    });

    it('points a non-default translation canonical at its own prefixed address', async () => {
      const metadata = await buildLandingPageMetadata(NL_ABOUT_SLUG);

      expect(metadata.alternates?.canonical).toBe(NL_ABOUT_PATH);
      expect(metadata.alternates?.languages).toMatchObject({
        nl: NL_ABOUT_PATH,
        en: '/about-us',
      });
    });

    it('emits locale, alternate locale and url for the NL translation of the same page', async () => {
      const metadata = await buildLandingPageMetadata(NL_ABOUT_SLUG);

      expect(metadata.openGraph?.locale).toBe('nl_NL');
      expect(metadata.openGraph?.alternateLocale).toEqual(['en_US']);
      expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the page fetch fails', async () => {
      getLandingPageMock.mockResolvedValue(errorResult(new Error('boom')));

      const metadata = await buildLandingPageMetadata('missing');

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'landing_page_metadata.fetch_failed',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('returns empty metadata without logging when the page simply does not exist', async () => {
      getLandingPageMock.mockResolvedValue(okResult());

      const metadata = await buildLandingPageMetadata('missing');

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });
});
