import { LOCALE_ISO_CODES } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  LANDING_PAGE_OG_IMAGE,
  mockLandingPage,
} from '@web/testing/pages/landing-page/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

import { buildLandingPageMetadata } from './build-landing-page-metadata';

const { getLandingPageMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
}));

vi.mock('@web/server/landing/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
}));

vi.mock('@web/server/request-context/request-context');

const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  LANDING_PAGE_OG_IMAGE,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const { EN, NL, DE } = LOCALE_ISO_CODES;

describe('buildLandingPageMetadata', () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('leaves the alternates without languages for a page with no translations', async () => {
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockLandingPage, translations: [] },
    });

    const metadata = await buildLandingPageMetadata('about-us');

    expect(metadata.alternates).toEqual({ canonical: '/about-us' });
  });

  it('lists every translation as hreflang with x-default on the default language', async () => {
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockLandingPage,
        translations: [
          { language: EN, slug: 'about-us' },
          { language: NL, slug: 'over-ons' },
        ],
      },
    });

    const metadata = await buildLandingPageMetadata('about-us');

    expect(metadata.alternates).toEqual({
      canonical: '/about-us',
      languages: {
        en: '/about-us',
        nl: '/nl/over-ons',
        'x-default': '/about-us',
      },
    });
  });

  it('points a non-default translation canonical at its own prefixed address', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockLandingPage,
        slug: 'over-ons',
        translations: [
          { language: EN, slug: 'about-us' },
          { language: NL, slug: 'over-ons' },
        ],
      },
    });

    const metadata = await buildLandingPageMetadata('over-ons');

    expect(metadata.alternates?.canonical).toBe('/nl/over-ons');
    expect(metadata.alternates?.languages).toMatchObject({
      nl: '/nl/over-ons',
      en: '/about-us',
    });
  });

  it('omits x-default when no translation exists in the default language', async () => {
    getLandingPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockLandingPage,
        translations: [
          { language: NL, slug: 'over-ons' },
          { language: DE, slug: 'ueber-uns' },
        ],
      },
    });

    const metadata = await buildLandingPageMetadata('over-ons');

    expect(metadata.alternates?.languages).toEqual({
      nl: '/nl/over-ons',
      de: '/de/ueber-uns',
    });
  });

  it('forwards the slug to getLandingPage, the loader LandingPage reads', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await buildLandingPageMetadata('about-us');

    expect(getLandingPageMock).toHaveBeenCalledWith('about-us');
  });

  it('maps the resolved seo straight through toMetadata, self-canonical to /[slug]', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

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

  it('returns empty metadata and logs when the page fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getLandingPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildLandingPageMetadata('missing');

    expect(metadata).toEqual({});
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('landing_page_metadata.fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('returns empty metadata without logging when the page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getLandingPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildLandingPageMetadata('missing');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
