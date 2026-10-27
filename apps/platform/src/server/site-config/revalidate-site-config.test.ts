import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import {
  MOCK_REVALIDATE_SECRET,
  MOCK_WEB_APP_URL,
} from '@platform/testing/env/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { revalidateSiteConfig } from './revalidate-site-config';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const MOCK_NETWORK_ERROR_MESSAGE = faker.lorem.words(2);

describe(revalidateSiteConfig, () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.WEB_APP_URL = MOCK_WEB_APP_URL;
    envMock.SITE_CONFIG_REVALIDATE_SECRET = MOCK_REVALIDATE_SECRET;
    fetchMock.mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the tenant id with the bearer secret to the revalidate route', async () => {
    await revalidateSiteConfig(MOCK_TENANT_ID);

    const [url, requestInit] = fetchMock.mock.calls[0] ?? [];
    const { signal, ...init } = requestInit ?? {};

    expect(url).toEqual(
      new URL(`${MOCK_WEB_APP_URL}/api/revalidate-site-config`),
    );
    expect(init).toEqual({
      method: HTTP_METHOD.POST,
      headers: {
        Authorization: `Bearer ${MOCK_REVALIDATE_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId: MOCK_TENANT_ID }),
    });
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it.each(['WEB_APP_URL', 'SITE_CONFIG_REVALIDATE_SECRET'] as const)(
    'logs and skips the call when %s is not configured',
    async (missingKey) => {
      envMock[missingKey] = undefined;

      await revalidateSiteConfig(MOCK_TENANT_ID);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        SITE_CONFIG_LOG.REVALIDATE_SKIPPED,
      );
    },
  );

  it('logs but does not throw when the response is not ok', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.UNAUTHORIZED }),
    );

    await expect(revalidateSiteConfig(MOCK_TENANT_ID)).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.REVALIDATE_FAILED,
      { responseStatus: HTTP_STATUS.UNAUTHORIZED },
    );
  });

  it.each([
    {
      cause: 'a network failure',
      error: new Error(MOCK_NETWORK_ERROR_MESSAGE),
    },
    {
      cause: 'a timeout',
      error: new DOMException('The signal timed out', 'TimeoutError'),
    },
  ])(
    'logs but does not throw when fetch rejects with $cause',
    async ({ error }) => {
      fetchMock.mockRejectedValue(error);

      await expect(
        revalidateSiteConfig(MOCK_TENANT_ID),
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith(
        SITE_CONFIG_LOG.REVALIDATE_ERROR,
        {
          errorName: error.name,
        },
      );
    },
  );
});
