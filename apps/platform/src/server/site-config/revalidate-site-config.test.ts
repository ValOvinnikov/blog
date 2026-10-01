import { env } from '@platform/utils/env/env';

import { revalidateSiteConfig } from './revalidate-site-config';

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const loggedEvent = (
  spy: ReturnType<typeof vi.spyOn>,
): Record<string, unknown> => {
  const call = spy.mock.calls.at(-1) as [string] | undefined;
  if (!call) {
    throw new Error('console.error was not called');
  }
  return JSON.parse(call[0]) as Record<string, unknown>;
};

describe(revalidateSiteConfig, () => {
  const fetchMock = vi.fn();
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.WEB_APP_URL = undefined;
    envMock.SITE_CONFIG_REVALIDATE_SECRET = undefined;
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('POSTs the tenant id with the bearer secret and a timeout to the revalidate route', async () => {
    envMock.WEB_APP_URL = 'https://example.com';
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await revalidateSiteConfig('tenant-1');

    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://example.com/api/revalidate-site-config'),
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer shared-secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId: 'tenant-1' }),
        signal: expect.any(AbortSignal),
      },
    );
  });

  it('logs and skips the call when WEB_APP_URL is not configured', async () => {
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';

    await revalidateSiteConfig('tenant-1');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggedEvent(consoleErrorSpy).event).toBe(
      'site_config.revalidate_skipped',
    );
  });

  it('logs and skips the call when SITE_CONFIG_REVALIDATE_SECRET is not configured', async () => {
    envMock.WEB_APP_URL = 'https://example.com';

    await revalidateSiteConfig('tenant-1');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggedEvent(consoleErrorSpy).event).toBe(
      'site_config.revalidate_skipped',
    );
  });

  it('logs but does not throw when the response is not ok', async () => {
    envMock.WEB_APP_URL = 'https://example.com';
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(revalidateSiteConfig('tenant-1')).resolves.toBeUndefined();

    const logged = loggedEvent(consoleErrorSpy);
    expect(logged.event).toBe('site_config.revalidate_failed');
    expect(logged.responseStatus).toBe(401);
  });

  it('logs but does not throw when fetch itself rejects', async () => {
    envMock.WEB_APP_URL = 'https://example.com';
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(revalidateSiteConfig('tenant-1')).resolves.toBeUndefined();

    const logged = loggedEvent(consoleErrorSpy);
    expect(logged.event).toBe('site_config.revalidate_error');
    expect((logged.error as { message: string }).message).toBe('network down');
  });

  it('logs but does not throw (and never hangs the caller) when the call times out', async () => {
    envMock.WEB_APP_URL = 'https://example.com';
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';
    fetchMock.mockRejectedValue(
      new DOMException('The signal timed out', 'TimeoutError'),
    );

    await expect(revalidateSiteConfig('tenant-1')).resolves.toBeUndefined();

    expect(loggedEvent(consoleErrorSpy).event).toBe(
      'site_config.revalidate_error',
    );
  });
});
