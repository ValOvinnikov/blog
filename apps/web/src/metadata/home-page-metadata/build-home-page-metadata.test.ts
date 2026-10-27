import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_BILINGUAL_REQUEST_CONTEXT,
  MOCK_DUTCH_REQUEST_CONTEXT,
  NL_PATH_PREFIX,
  mockMetadataSeo,
} from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildHomePageMetadata } from './build-home-page-metadata';

const { getHomePageMock } = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
}));

vi.mock('@web/server/home/get-home-page/get-home-page', () => ({
  getHomePage: getHomePageMock,
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(5202);

const { EN, NL, DE } = LOCALE_ISO_CODES;
const HOME_PATH = routes.home();
const NL_HOME_PATH = NL_PATH_PREFIX;
const MOCK_SEO = mockMetadataSeo();

const homePage = (translations: string[]) =>
  okResult({
    hero: undefined,
    modules: [],
    faqs: [],
    seo: MOCK_SEO,
    translations,
  });

describe(buildHomePageMetadata, () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(
      MOCK_BILINGUAL_REQUEST_CONTEXT,
    );
  });

  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the fetch fails', async () => {
      getHomePageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildHomePageMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'home_page.metadata_fetch_failed',
        { error: MOCK_ERROR },
      );
    });

    it('returns empty metadata without logging when this language has no Home', async () => {
      getHomePageMock.mockResolvedValue(okResult());

      const metadata = await buildHomePageMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });

  describe('when only this Home exists', () => {
    beforeEach(() => {
      getHomePageMock.mockResolvedValue(homePage([EN]));
    });

    it('uses the seo title as the absolute title', async () => {
      const metadata = await buildHomePageMetadata();

      expect(metadata.title).toEqual({ absolute: MOCK_SEO.title });
    });

    it('is self-canonical to / with no languages', async () => {
      const metadata = await buildHomePageMetadata();

      expect(metadata.alternates).toEqual({ canonical: HOME_PATH });
    });
  });

  it('lists every live Home as hreflang with x-default on the default language', async () => {
    getHomePageMock.mockResolvedValue(homePage([EN, NL, DE]));

    const metadata = await buildHomePageMetadata();

    expect(metadata.alternates).toEqual({
      canonical: HOME_PATH,
      languages: { en: HOME_PATH, nl: NL_HOME_PATH, 'x-default': HOME_PATH },
    });
  });

  it('points a non-default Home canonical at its own prefixed address', async () => {
    vi.mocked(getRequestContext).mockResolvedValue(MOCK_DUTCH_REQUEST_CONTEXT);
    getHomePageMock.mockResolvedValue(homePage([EN, NL]));

    const metadata = await buildHomePageMetadata();

    expect(metadata.alternates).toEqual({
      canonical: NL_HOME_PATH,
      languages: { en: HOME_PATH, nl: NL_HOME_PATH, 'x-default': HOME_PATH },
    });
  });
});
