import { HTTP_METHOD, HTTP_STATUS, LOCALE_ISO_CODES } from '@blog/config';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@blog/utils/enqueue-signature';
import { faker } from '@faker-js/faker';
import { LEAD_LOG } from '@platform/constants/lead';
import { MOCK_WEB_APP_URL } from '@platform/testing/env/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { fetchPageTitle } from './fetch-page-title';

faker.seed(5761);

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;
const loggerErrorMock = vi.mocked(logger.error);

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_DOCUMENT_ID = faker.string.alphanumeric(12);
const MOCK_PAGE_PATH = `/api/internal/pages/${MOCK_DOCUMENT_ID}`;
const MOCK_PAGE_TITLE = faker.lorem.words(2);
const MOCK_NETWORK_ERROR = new Error(faker.lorem.sentence());

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
    envMock.WEB_APP_URL = MOCK_WEB_APP_URL;
    envMock.INTERNAL_PAGES_SECRET = MOCK_SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks the website's pages route for the title, signed so the website accepts it", async () => {
    const title = await fetchTitle();

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Record<string, string>;
    const rawBody = init.body as string;
    const isSigned = isValidEnqueueSignature({
      secret: MOCK_SECRET,
      timestamp: headers[ENQUEUE_TIMESTAMP_HEADER] ?? null,
      signature: headers[ENQUEUE_SIGNATURE_HEADER] ?? null,
      path: MOCK_PAGE_PATH,
      rawBody,
    });

    expect(title).toBe(MOCK_PAGE_TITLE);
    expect(url.toString()).toBe(`${MOCK_WEB_APP_URL}${MOCK_PAGE_PATH}`);
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(JSON.parse(rawBody)).toEqual({
      tenantId: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
    expect(isSigned).toBe(true);
  });

  it.each([
    ['website URL', 'WEB_APP_URL', { hasWebAppUrl: false, hasSecret: true }],
    [
      'secret',
      'INTERNAL_PAGES_SECRET',
      { hasWebAppUrl: true, hasSecret: false },
    ],
  ] as const)(
    'asks nothing and logs without a %s',
    async (_label, key, configured) => {
      envMock[key] = undefined;

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
      error: MOCK_NETWORK_ERROR,
    });
  });

  it('returns no title for a response without one', async () => {
    fetchMock.mockResolvedValue(Response.json({}));

    const title = await fetchTitle();

    expect(title).toBeUndefined();
  });
});
