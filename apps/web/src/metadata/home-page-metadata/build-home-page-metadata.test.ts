import { LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildHomePageMetadata } from './build-home-page-metadata';

const { getHomePageMock } = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
}));

vi.mock('@web/server/home/get-home-page/get-home-page', () => ({
  getHomePage: getHomePageMock,
}));

vi.mock('@web/server/request-context/request-context');

const { EN, NL, DE } = LOCALE_ISO_CODES;

const homePage = (translations: string[]) =>
  okResult({
    hero: undefined,
    modules: [],
    faqs: [],
    seo: mockSeo({ title: 'Home' }),
    translations,
  });

describe('buildHomePageMetadata', () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      liveLocales: [EN, NL],
    });
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the fetch fails', async () => {
      getHomePageMock.mockResolvedValue(errorResult(new Error('boom')));

      expect(await buildHomePageMetadata()).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'home_page.metadata_fetch_failed',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('returns empty metadata without logging when this language has no Home', async () => {
      getHomePageMock.mockResolvedValue(okResult());

      expect(await buildHomePageMetadata()).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
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
      ...MOCK_REQUEST_CONTEXT,
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
