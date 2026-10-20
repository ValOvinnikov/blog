// @vitest-environment node
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import type { MockInstance } from 'vitest';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: vi.fn(),
}));

const getSiteConfigMock = vi.mocked(getSiteConfig);
const resolveRequestTenantMock = vi.mocked(resolveRequestTenant);

const FAVICON_URL = 'https://blob.example.com/tenants/tenant-a/favicon.png';
const FALLBACK_CONTENT = '.l1{fill:#2E6BD6}';

const mockSiteConfig = (faviconAssetUrl: string | undefined) => {
  getSiteConfigMock.mockResolvedValue({
    ok: true,
    data: { faviconAssetUrl },
  } as Awaited<ReturnType<typeof getSiteConfig>>);
};

describe('icon', () => {
  let Icon: typeof import('./icon').default;
  let consoleErrorSpy: MockInstance<typeof console.error>;

  beforeEach(async () => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getSiteConfigMock.mockReset();
    resolveRequestTenantMock.mockResolvedValue({ id: 'tenant-a' } as Awaited<
      ReturnType<typeof resolveRequestTenant>
    >);
    ({ default: Icon } = await import('./icon'));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  describe('when the tenant has uploaded a favicon on Look', () => {
    beforeEach(() => {
      mockSiteConfig(FAVICON_URL);
    });

    it('serves the uploaded favicon with its own content type', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const response = await Icon();

      expect(fetchMock).toHaveBeenCalledWith(
        FAVICON_URL,
        expect.objectContaining({ signal: expect.anything() }),
      );
      expect(response.headers.get('content-type')).toBe('image/png');
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(
        new Uint8Array([1, 2, 3]),
      );
    });

    it('falls back to the default mark and logs when the favicon responds with a non-2xx status', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
      );

      const response = await Icon();

      expect(response.headers.get('content-type')).toBe('image/svg+xml');
      expect(await response.text()).toContain(FALLBACK_CONTENT);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('404'),
      );
    });

    it('falls back to the default mark and logs when the favicon fetch throws', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('network error')),
      );

      const response = await Icon();

      expect(await response.text()).toContain(FALLBACK_CONTENT);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('icon.favicon_fetch_failed'),
      );
    });
  });

  it('reads the site config of the tenant resolved from the host', async () => {
    mockSiteConfig(undefined);

    await Icon();

    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-a');
  });

  it('falls back to the default mark when no favicon is uploaded', async () => {
    mockSiteConfig(undefined);

    const response = await Icon();

    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(await response.text()).toContain(FALLBACK_CONTENT);
  });

  it('falls back to the default mark when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue({ ok: true, data: undefined });

    const response = await Icon();

    expect(await response.text()).toContain(FALLBACK_CONTENT);
  });

  it('falls back to the default mark and logs when the site config read fails', async () => {
    getSiteConfigMock.mockResolvedValue({
      ok: false,
      error: new Error('down'),
    } as Awaited<ReturnType<typeof getSiteConfig>>);

    const response = await Icon();

    expect(await response.text()).toContain(FALLBACK_CONTENT);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('icon.site_config_fetch_failed'),
    );
  });

  it('falls back to the default mark without reading site config when no tenant serves the host', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    const response = await Icon();

    expect(await response.text()).toContain(FALLBACK_CONTENT);
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });
});
