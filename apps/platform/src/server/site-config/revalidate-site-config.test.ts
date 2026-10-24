import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import {
  MOCK_WEB_APP_URL,
  MOCK_REVALIDATE_SECRET,
} from '@platform/testing/env/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { revalidateSiteConfig } from './revalidate-site-config';

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const NETWORK_ERROR_MESSAGE = 'network down';

const loggerErrorMock = vi.mocked(logger.error);

describe(revalidateSiteConfig, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.WEB_APP_URL = undefined;
    envMock.SITE_CONFIG_REVALIDATE_SECRET = undefined;
  });

  it('POSTs the tenant id with the bearer secret and a timeout to the revalidate route', async () => {
    envMock.WEB_APP_URL = MOCK_WEB_APP_URL;
    envMock.SITE_CONFIG_REVALIDATE_SECRET = MOCK_REVALIDATE_SECRET;
    fetchMock.mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));

    await revalidateSiteConfig(MOCK_TENANT_ID);

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(`${MOCK_WEB_APP_URL}/api/revalidate-site-config`),
      {
        method: HTTP_METHOD.POST,
        headers: {
          Authorization: `Bearer ${MOCK_REVALIDATE_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId: MOCK_TENANT_ID }),
        signal: expect.any(AbortSignal),
      },
    );
  });

  it('logs and skips the call when WEB_APP_URL is not configured', async () => {
    envMock.SITE_CONFIG_REVALIDATE_SECRET = MOCK_REVALIDATE_SECRET;

    await revalidateSiteConfig(MOCK_TENANT_ID);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.REVALIDATE_SKIPPED,
    );
  });

  it('logs and skips the call when SITE_CONFIG_REVALIDATE_SECRET is not configured', async () => {
    envMock.WEB_APP_URL = MOCK_WEB_APP_URL;

    await revalidateSiteConfig(MOCK_TENANT_ID);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.REVALIDATE_SKIPPED,
    );
  });

  it('logs but does not throw when the response is not ok', async () => {
    envMock.WEB_APP_URL = MOCK_WEB_APP_URL;
    envMock.SITE_CONFIG_REVALIDATE_SECRET = MOCK_REVALIDATE_SECRET;
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.UNAUTHORIZED }),
    );

    await expect(revalidateSiteConfig(MOCK_TENANT_ID)).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.REVALIDATE_FAILED,
      { responseStatus: HTTP_STATUS.UNAUTHORIZED },
    );
  });

  it('logs but does not throw when fetch itself rejects', async () => {
    envMock.WEB_APP_URL = MOCK_WEB_APP_URL;
    envMock.SITE_CONFIG_REVALIDATE_SECRET = MOCK_REVALIDATE_SECRET;
    fetchMock.mockRejectedValue(new Error(NETWORK_ERROR_MESSAGE));

    await expect(revalidateSiteConfig(MOCK_TENANT_ID)).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.REVALIDATE_ERROR,
      {
        error: new Error(NETWORK_ERROR_MESSAGE),
      },
    );
  });

  it('logs but does not throw (and never hangs the caller) when the call times out', async () => {
    envMock.WEB_APP_URL = MOCK_WEB_APP_URL;
    envMock.SITE_CONFIG_REVALIDATE_SECRET = MOCK_REVALIDATE_SECRET;
    fetchMock.mockRejectedValue(
      new DOMException('The signal timed out', 'TimeoutError'),
    );

    await expect(revalidateSiteConfig(MOCK_TENANT_ID)).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.REVALIDATE_ERROR,
      expect.objectContaining({ error: expect.any(DOMException) }),
    );
  });
});
