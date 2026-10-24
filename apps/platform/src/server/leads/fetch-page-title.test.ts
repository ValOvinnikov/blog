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

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;
const loggerErrorMock = vi.mocked(logger.error);

const SECRET = faker.string.alphanumeric(32);
const DOCUMENT_ID = 'page-hire-me';
const PAGE_PATH = `/api/internal/pages/${DOCUMENT_ID}`;
const PAGE_TITLE = 'Hire me';

const fetchTitle = () =>
  fetchPageTitle({
    tenantId: MOCK_TENANT_ID,
    documentId: DOCUMENT_ID,
    locale: LOCALE_ISO_CODES.DE,
  });

describe(fetchPageTitle, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    loggerErrorMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(Response.json({ title: PAGE_TITLE }));
    vi.stubGlobal('fetch', fetchMock);
    envMock.WEB_APP_URL = MOCK_WEB_APP_URL;
    envMock.INTERNAL_PAGES_SECRET = SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks the website's pages route for the title, signed so the website accepts it", async () => {
    await expect(fetchTitle()).resolves.toBe(PAGE_TITLE);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(url.toString()).toBe(`${MOCK_WEB_APP_URL}${PAGE_PATH}`);
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(JSON.parse(init.body as string)).toEqual({
      tenantId: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
    expect(
      isValidEnqueueSignature({
        secret: SECRET,
        timestamp: headers[ENQUEUE_TIMESTAMP_HEADER] ?? null,
        signature: headers[ENQUEUE_SIGNATURE_HEADER] ?? null,
        path: PAGE_PATH,
        rawBody: init.body as string,
      }),
    ).toBe(true);
  });

  it.each([
    ['website URL', 'WEB_APP_URL'],
    ['secret', 'INTERNAL_PAGES_SECRET'],
  ] as const)('asks nothing and logs without a %s', async (_label, key) => {
    envMock[key] = undefined;

    await expect(fetchTitle()).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      LEAD_LOG.PAGE_TITLE_SKIPPED,
      expect.any(Object),
    );
  });

  it('returns no title, quietly, for a page that is gone', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.NOT_FOUND }),
    );

    await expect(fetchTitle()).resolves.toBeUndefined();

    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns no title and logs the status when the website fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
    );

    await expect(fetchTitle()).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(LEAD_LOG.PAGE_TITLE_FAILED, {
      tenantId: MOCK_TENANT_ID,
      responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  });

  it('returns no title and logs when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(fetchTitle()).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      LEAD_LOG.PAGE_TITLE_ERROR,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('returns no title for a response without one', async () => {
    fetchMock.mockResolvedValue(Response.json({}));

    await expect(fetchTitle()).resolves.toBeUndefined();
  });
});
