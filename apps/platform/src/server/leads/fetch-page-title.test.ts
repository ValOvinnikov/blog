import { faker } from '@faker-js/faker';
import { LEAD_LOG } from '@platform/constants/lead';
import { MOCK_WEB_APP_URL } from '@platform/testing/env/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockedWebSecretsEnv } from '@platform/testing/env/mocked-web-secrets-env';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { readSentSignedRequest } from '@platform/testing/worker/sent-signed-request';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_METHOD, HTTP_STATUS, LOCALE_ISO_CODES } from '@shinefold/config';

import { fetchPageTitle } from './fetch-page-title';

faker.seed(5761);

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/web-secrets-env/web-secrets-env');

const loggerErrorMock = vi.mocked(logger.error);

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_DOCUMENT_ID = faker.string.alphanumeric(12);
const MOCK_PAGE_PATH = `/api/internal/pages/${MOCK_DOCUMENT_ID}`;
const MOCK_PAGE_TITLE = faker.lorem.words(2);

const fetchTitle = () =>
  fetchPageTitle({
    tenantId: MOCK_TENANT_ID,
    documentId: MOCK_DOCUMENT_ID,
    locale: LOCALE_ISO_CODES.DE,
  });

describe(fetchPageTitle, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    loggerErrorMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(Response.json({ title: MOCK_PAGE_TITLE }));
    vi.stubGlobal('fetch', fetchMock);
    mockedEnv.WEB_APP_URL = MOCK_WEB_APP_URL;
    mockedWebSecretsEnv.INTERNAL_PAGES_SECRET = MOCK_SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks the website's pages route for the title, signed so the website accepts it", async () => {
    const title = await fetchTitle();

    const { url, method, body, isSignedWith } =
      readSentSignedRequest(fetchMock);

    expect(title).toBe(MOCK_PAGE_TITLE);
    expect(url.toString()).toBe(`${MOCK_WEB_APP_URL}${MOCK_PAGE_PATH}`);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(body).toEqual({
      tenantId: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
    expect(isSignedWith(MOCK_SECRET, MOCK_PAGE_PATH)).toBe(true);
  });

  it.each([
    [
      'website URL',
      () => {
        mockedEnv.WEB_APP_URL = undefined;
      },
      { hasWebAppUrl: false, hasSecret: true },
    ],
    [
      'secret',
      () => {
        mockedWebSecretsEnv.INTERNAL_PAGES_SECRET = undefined;
      },
      { hasWebAppUrl: true, hasSecret: false },
    ],
  ])(
    'asks nothing and logs without a %s',
    async (_label, unset, configured) => {
      unset();

      const title = await fetchTitle();

      expect(title).toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).toHaveBeenCalledWith(
        LEAD_LOG.PAGE_TITLE_SKIPPED,
        configured,
      );
    },
  );

  it('returns no title, quietly, for a page that is gone', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.NOT_FOUND }),
    );

    const title = await fetchTitle();

    expect(title).toBeUndefined();
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns no title and logs the status when the website fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
    );

    const title = await fetchTitle();

    expect(title).toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith(LEAD_LOG.PAGE_TITLE_FAILED, {
      tenantId: MOCK_TENANT_ID,
      responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  });

  it('returns no title and logs when the request throws', async () => {
    fetchMock.mockRejectedValue(MOCK_NETWORK_ERROR);

    const title = await fetchTitle();

    expect(title).toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith(LEAD_LOG.PAGE_TITLE_ERROR, {
      tenantId: MOCK_TENANT_ID,
      errorName: MOCK_NETWORK_ERROR.name,
    });
  });

  it('returns no title for a response without one', async () => {
    fetchMock.mockResolvedValue(Response.json({}));

    const title = await fetchTitle();

    expect(title).toBeUndefined();
  });
});
