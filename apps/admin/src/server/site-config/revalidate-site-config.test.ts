import { revalidateSiteConfig } from './revalidate-site-config';

const { envMock } = vi.hoisted(() => ({
  envMock: {
    WEB_APP_URL: undefined as string | undefined,
    SITE_CONFIG_REVALIDATE_SECRET: undefined as string | undefined,
  },
}));

vi.mock('@admin/utils/env/env', () => ({
  get env() {
    return envMock;
  },
}));

describe(revalidateSiteConfig, () => {
  const fetchMock = vi.fn();
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);

  beforeEach(() => {
    fetchMock.mockReset();
    consoleErrorSpy.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    envMock.WEB_APP_URL = undefined;
    envMock.SITE_CONFIG_REVALIDATE_SECRET = undefined;
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('POSTs the shared secret as a bearer token to the web app revalidation route, with a timeout signal', async () => {
    envMock.WEB_APP_URL = 'https://example.com';
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await revalidateSiteConfig();

    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://example.com/api/revalidate-site-config'),
      {
        method: 'POST',
        headers: { Authorization: 'Bearer shared-secret' },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it('logs and skips the call when WEB_APP_URL is not configured', async () => {
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';

    await revalidateSiteConfig();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('logs and skips the call when SITE_CONFIG_REVALIDATE_SECRET is not configured', async () => {
    envMock.WEB_APP_URL = 'https://example.com';

    await revalidateSiteConfig();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('logs but does not throw when the response is not ok', async () => {
    envMock.WEB_APP_URL = 'https://example.com';
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(revalidateSiteConfig()).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('401'),
    );
  });

  it('logs but does not throw when fetch itself rejects', async () => {
    envMock.WEB_APP_URL = 'https://example.com';
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(revalidateSiteConfig()).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to call'),
      expect.stringContaining('network down'),
    );
  });

  it('logs but does not throw (and never hangs the caller) when the call times out', async () => {
    envMock.WEB_APP_URL = 'https://example.com';
    envMock.SITE_CONFIG_REVALIDATE_SECRET = 'shared-secret';
    fetchMock.mockRejectedValue(
      new DOMException('The signal timed out', 'TimeoutError'),
    );

    await expect(revalidateSiteConfig()).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to call'),
      expect.stringContaining('timed out'),
    );
  });
});
