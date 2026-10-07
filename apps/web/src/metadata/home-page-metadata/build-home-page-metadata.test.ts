import { LOCALE_ISO_CODES } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import type { MockInstance } from 'vitest';

import { buildHomePageMetadata } from './build-home-page-metadata';

const { getHomePageMock } = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
}));

vi.mock('@web/server/home/get-home-page/get-home-page', () => ({
  getHomePage: getHomePageMock,
}));

vi.mock('@web/server/request-context/request-context');

const { EN, NL, DE } = LOCALE_ISO_CODES;

const homePage = (translations: string[]) => ({
  ok: true,
  data: {
    hero: undefined,
    modules: [],
    faqs: [],
    seo: makeSeo({ title: 'Home' }),
    translations,
  },
});

describe('buildHomePageMetadata', () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      liveLocales: [EN, NL],
    });
  });

  describe('when no metadata can be built', () => {
    let errorSpy: MockInstance<typeof console.error>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('returns empty metadata and logs when the fetch fails', async () => {
      getHomePageMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      expect(await buildHomePageMetadata()).toEqual({});
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('home_page.metadata_fetch_failed'),
      );
    });

    it('returns empty metadata without logging when this language has no Home', async () => {
      getHomePageMock.mockResolvedValue({ ok: true, data: undefined });

      expect(await buildHomePageMetadata()).toEqual({});
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('when only this Home exists', () => {
    beforeEach(() => {
      getHomePageMock.mockResolvedValue(homePage([EN]));
    });

    it('uses the seo title as the absolute title', async () => {
      const metadata = await buildHomePageMetadata();

      expect(metadata.title).toEqual({ absolute: 'Home' });
    });

    it('is self-canonical to / with no languages when only this Home exists', async () => {
      const metadata = await buildHomePageMetadata();

      expect(metadata.alternates).toEqual({ canonical: '/' });
    });
  });

  it('lists every live Home as hreflang with x-default on the default language', async () => {
    getHomePageMock.mockResolvedValue(homePage([EN, NL, DE]));

    const metadata = await buildHomePageMetadata();

    expect(metadata.alternates).toEqual({
      canonical: '/',
      languages: { en: '/', nl: '/nl', 'x-default': '/' },
    });
  });

  it('points a non-default Home canonical at its own prefixed address', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });
    getHomePageMock.mockResolvedValue(homePage([EN, NL]));

    const metadata = await buildHomePageMetadata();

    expect(metadata.alternates).toEqual({
      canonical: '/nl',
      languages: { en: '/', nl: '/nl', 'x-default': '/' },
    });
  });
});
