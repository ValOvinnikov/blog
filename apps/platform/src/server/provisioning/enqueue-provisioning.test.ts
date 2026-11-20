import { faker } from '@faker-js/faker';
import { CUSTOM_DOMAIN_PATH } from '@platform/constants/custom-domain';
import { PROVISION_PATH } from '@platform/constants/provisioning';
import { WORKER_LOG } from '@platform/constants/worker';
import {
  mockedEnv,
  mockedWorkerSecretsEnv,
} from '@platform/testing/env/mocked-env';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import {
  MOCK_WORKER_SECRET,
  MOCK_WORKER_URL,
} from '@platform/testing/worker/fixtures';
import { readSentSignedRequest } from '@platform/testing/worker/sent-signed-request';
import {
  stubWorkerFetch,
  type TWorkerFetchMock,
} from '@platform/testing/worker/stub-worker-fetch';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config';

import {
  enqueueProvisioning,
  enqueueWorkerRequest,
  sendWorkerRequest,
} from './enqueue-provisioning';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/worker-secrets-env/worker-secrets-env');

faker.seed(5997);

const loggerErrorMock = vi.mocked(logger.error);
const fetchMock: TWorkerFetchMock = vi.fn();

const MOCK_NETWORK_ERROR_MESSAGE = faker.lorem.words(2);

describe(enqueueProvisioning, () => {
  beforeEach(() => {
    stubWorkerFetch(fetchMock);
  });

  it.each([
    {
      missing: 'worker URL',
      unset: () => {
        mockedEnv.WORKER_ENQUEUE_URL = undefined;
      },
      hasWorkerUrl: false,
      hasSecret: true,
    },
    {
      missing: 'enqueue secret',
      unset: () => {
        mockedWorkerSecretsEnv.WORKER_ENQUEUE_SECRET = undefined;
      },
      hasWorkerUrl: true,
      hasSecret: false,
    },
  ] as const)(
    'skips the request, logs and returns null without a $missing',
    async ({ unset, hasWorkerUrl, hasSecret }) => {
      unset();

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

    const { url, method, body, isSignedWith } =
      readSentSignedRequest(fetchMock);

    expect(url.toString()).toBe(`${MOCK_WORKER_URL}${PROVISION_PATH}`);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(body).toEqual({ tenantId: MOCK_TENANT_ID });
    expect(isSignedWith(MOCK_WORKER_SECRET, PROVISION_PATH)).toBe(true);
  });

  it('includes the domain in the signed body when one is given', async () => {
    await enqueueWorkerRequest(CUSTOM_DOMAIN_PATH.CONNECT, {
      tenantId: MOCK_TENANT_ID,
      domain: MOCK_CUSTOM_DOMAIN,
    });

    const { body, isSignedWith } = readSentSignedRequest(fetchMock);

    expect(body).toEqual({
      tenantId: MOCK_TENANT_ID,
      domain: MOCK_CUSTOM_DOMAIN,
    });
    expect(isSignedWith(MOCK_WORKER_SECRET, CUSTOM_DOMAIN_PATH.CONNECT)).toBe(
      true,
    );
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

describe(sendWorkerRequest, () => {
  const MOCK_WORKER_BODY = { removed: [MOCK_TENANT_ID] };
  const MOCK_TIMEOUT_MS = 60_000;
  const MOCK_GATEWAY_PAGE = '<html>Bad gateway</html>';

  const send = (options?: Parameters<typeof sendWorkerRequest>[2]) =>
    sendWorkerRequest(PROVISION_PATH, { tenantId: MOCK_TENANT_ID }, options);

  beforeEach(() => {
    stubWorkerFetch(fetchMock);
    fetchMock.mockResolvedValue(Response.json(MOCK_WORKER_BODY));
  });

  it('times the request out after the given limit', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');

    await send({ timeoutMs: MOCK_TIMEOUT_MS });

    expect(timeoutSpy).toHaveBeenCalledExactlyOnceWith(MOCK_TIMEOUT_MS);
  });

  it('returns the status alone unless asked for the body', async () => {
    const response = await send();

    expect(response).toEqual({ status: HTTP_STATUS.OK });
  });

  it('returns the JSON body with its status when asked for it', async () => {
    const response = await send({ readsBody: true });

    expect(response).toEqual({
      status: HTTP_STATUS.OK,
      body: MOCK_WORKER_BODY,
    });
  });

  it('keeps the status of an answer that is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response(MOCK_GATEWAY_PAGE, { status: HTTP_STATUS.BAD_GATEWAY }),
    );

    const response = await send({ readsBody: true });

    expect(response).toEqual({
      status: HTTP_STATUS.BAD_GATEWAY,
      body: undefined,
    });
  });
});
