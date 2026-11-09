import { LOCALE_ISO_CODES, routes, type TLocaleIsoCode } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { COOKIE_STATEMENT_LOG } from '@web/constants/cookie-statement';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  mockMetadataSeo,
  NL_PATH_PREFIX,
} from '@web/testing/metadata/to-metadata/fixtures';
import { mockCookieStatementPage } from '@web/testing/shared/cookie-statement/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { logger } from '@web/utils/logger/logger';

import { buildCookieStatementMetadata } from './build-cookie-statement-metadata';

const { getCookieStatementPageMock } = vi.hoisted(() => ({
  getCookieStatementPageMock: vi.fn(),
}));

vi.mock(
  '@web/server/cookie-statement/get-cookie-statement-page/get-cookie-statement-page',
  () => ({ getCookieStatementPage: getCookieStatementPageMock }),
);

vi.mock('@web/server/request-context/request-context');

const { EN, NL, DE } = LOCALE_ISO_CODES;
const COOKIE_STATEMENT_PATH = routes.cookieStatement();
const NL_COOKIE_STATEMENT_PATH = `${NL_PATH_PREFIX}${COOKIE_STATEMENT_PATH}`;

const MOCK_SEO = mockMetadataSeo();
const { title, description } = MOCK_SEO;

const resolvePageWith = (translations: TLocaleIsoCode[] = [EN]) =>
  getCookieStatementPageMock.mockResolvedValue(
    okResult(mockCookieStatementPage({ seo: MOCK_SEO, translations })),
  );

describe(buildCookieStatementMetadata, () => {
  beforeEach(() => {
    getCookieStatementPageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
    resolvePageWith();
  });

  it('builds metadata from the resolved seo, self-canonical to the cookie statement', async () => {
    const metadata = await buildCookieStatementMetadata();

    expect(metadata.title).toBe(title);
    expect(metadata.description).toBe(description);
    expect(metadata.alternates?.canonical).toBe(COOKIE_STATEMENT_PATH);
  });

  it('lists each live translated language as hreflang, canonical to its prefix', async () => {
    vi.mocked(getRequestContext).mockResolvedValue(MOCK_DUTCH_REQUEST_CONTEXT);
    resolvePageWith([EN, NL, DE]);

    const metadata = await buildCookieStatementMetadata();

    expect(metadata.alternates).toEqual({
      canonical: NL_COOKIE_STATEMENT_PATH,
      languages: {
        en: COOKIE_STATEMENT_PATH,
        nl: NL_COOKIE_STATEMENT_PATH,
        'x-default': COOKIE_STATEMENT_PATH,
      },
    });
  });

  it('returns empty metadata and logs when the fetch fails', async () => {
    getCookieStatementPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const metadata = await buildCookieStatementMetadata();

    expect(metadata).toEqual({});
    expect(logger.error).toHaveBeenCalledWith(
      COOKIE_STATEMENT_LOG.METADATA_FETCH_FAILED,
      { error: MOCK_ERROR },
    );
  });

  it('returns empty metadata without logging when no statement is published', async () => {
    getCookieStatementPageMock.mockResolvedValue(okResult());

    const metadata = await buildCookieStatementMetadata();

    expect(metadata).toEqual({});
    expect(logger.error).not.toHaveBeenCalled();
  });
});
