import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@blog/utils/enqueue-signature';
import { faker } from '@faker-js/faker';
import { WORKER_LOG } from '@platform/constants/worker';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { enqueueProvisioning } from './enqueue-provisioning';

vi.mock('@platform/utils/env/env');

faker.seed(5997);

const envMock: Partial<Record<keyof typeof env, string>> = env;
const loggerErrorMock = vi.mocked(logger.error);
const fetchMock = vi.fn();

const MOCK_WORKER_URL = `https://${faker.internet.domainName()}`;
const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_NETWORK_ERROR_MESSAGE = faker.lorem.words(2);
const PROVISION_PATH = '/api/provision';

describe(enqueueProvisioning, () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.ACCEPTED }),
    );
    vi.stubGlobal('fetch', fetchMock);
    envMock.WORKER_ENQUEUE_URL = MOCK_WORKER_URL;
    envMock.WORKER_ENQUEUE_SECRET = MOCK_SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    {
      missing: 'worker URL',
      key: 'WORKER_ENQUEUE_URL',
      hasWorkerUrl: false,
      hasSecret: true,
    },
    {
      missing: 'enqueue secret',
      key: 'WORKER_ENQUEUE_SECRET',
      hasWorkerUrl: true,
      hasSecret: false,
    },
  ] as const)(
    'skips the request, logs and returns null without a $missing',
    async ({ key, hasWorkerUrl, hasSecret }) => {
      envMock[key] = undefined;

      const status = await enqueueProvisioning(MOCK_TENANT_ID);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).toHaveBeenCalledWith(WORKER_LOG.ENQUEUE_SKIPPED, {
        tenantId: MOCK_TENANT_ID,
        path: PROVISION_PATH,
        hasWorkerUrl,
        hasSecret,
      });
      expect(status).toBeNull();
    },
  );

  it('POSTs the tenant id to the provision route, signed so the worker accepts it', async () => {
    await enqueueProvisioning(MOCK_TENANT_ID);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(url.toString()).toBe(`${MOCK_WORKER_URL}${PROVISION_PATH}`);
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(JSON.parse(init.body as string)).toEqual({
      tenantId: MOCK_TENANT_ID,
    });
    expect(
      isValidEnqueueSignature({
        secret: MOCK_SECRET,
        timestamp: headers[ENQUEUE_TIMESTAMP_HEADER] ?? null,
        signature: headers[ENQUEUE_SIGNATURE_HEADER] ?? null,
        path: PROVISION_PATH,
        rawBody: init.body as string,
      }),
    ).toBe(true);
  });

  it.each([
    HTTP_STATUS.ACCEPTED,
    HTTP_STATUS.NOT_FOUND,
    HTTP_STATUS.CONFLICT,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  ])("returns the worker's %i response status", async (responseStatus) => {
    fetchMock.mockResolvedValue(new Response(null, { status: responseStatus }));

    const status = await enqueueProvisioning(MOCK_TENANT_ID);

    expect(status).toBe(responseStatus);
  });

  it('logs and returns null when the request fails', async () => {
    const error = new Error(MOCK_NETWORK_ERROR_MESSAGE);
    fetchMock.mockRejectedValue(error);

    const status = await enqueueProvisioning(MOCK_TENANT_ID);

    expect(loggerErrorMock).toHaveBeenCalledWith(WORKER_LOG.ENQUEUE_ERROR, {
      tenantId: MOCK_TENANT_ID,
      path: PROVISION_PATH,
      errorName: error.name,
    });
    expect(status).toBeNull();
  });
});
