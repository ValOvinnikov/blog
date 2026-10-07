// @vitest-environment node
import type { ISanityImage } from '@blog/config';
import { type TTenantSanityContext, urlForSanityImage } from '@blog/service';
import type { MockInstance } from 'vitest';

const { getSiteSettingsMock, getHostTenantSanityContextMock } = vi.hoisted(
  () => ({
    getSiteSettingsMock: vi.fn(),
    getHostTenantSanityContextMock: vi.fn(),
  }),
);

vi.mock('@blog/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@blog/service')>();
  return {
    ...actual,
    service: {
      global: {
        siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
      },
    },
  };
});

vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({
    getHostTenantSanityContext: getHostTenantSanityContextMock,
  }),
);

const logo: ISanityImage = {
  assetId: 'image-abc123def-800x600-svg',
  alt: 'Logo',
  hotspot: undefined,
  crop: undefined,
  lqip: undefined,
  dimensions: undefined,
};
const brand = { logo };
const FALLBACK_CONTENT = '.l1{fill:#2E6BD6}';

const DEFAULT_TENANT: TTenantSanityContext = {
  projectId: 'tenant-project',
  dataset: 'tenant-dataset',
  token: 'tenant-token',
};

const EXPECTED_ICON_URL = urlForSanityImage(logo, DEFAULT_TENANT, {
  width: 64,
  height: 64,
  fit: 'crop',
});

describe('icon', () => {
  let Icon: typeof import('./icon').default;
  let consoleErrorSpy: MockInstance<typeof console.error>;

  beforeEach(async () => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getSiteSettingsMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: DEFAULT_TENANT,
    });
    ({ default: Icon } = await import('./icon'));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  describe('when the site has a logo', () => {
    beforeEach(() => {
      getSiteSettingsMock.mockResolvedValue({ ok: true, data: { brand } });
    });

    it('builds a real crop URL directly from the raw asset reference and fetches it', async () => {
      expect(EXPECTED_ICON_URL).toMatch(
        /^https:\/\/cdn\.sanity\.io\/images\/tenant-project\/tenant-dataset\/.+\?.*w=64.*h=64.*fit=crop/,
      );

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { 'Content-Type': 'image/webp' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const response = await Icon();

      expect(fetchMock).toHaveBeenCalledWith(
        EXPECTED_ICON_URL,
        expect.objectContaining({ signal: expect.anything() }),
      );
      expect(response.headers.get('content-type')).toBe('image/webp');
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(
        new Uint8Array([1, 2, 3]),
      );
    });

    it('falls back to the static mark and logs when the logo fetch responds with a non-2xx status', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 404 }));
      vi.stubGlobal('fetch', fetchMock);

      const response = await Icon();

      expect(response.headers.get('content-type')).toBe('image/svg+xml');
      expect(await response.text()).toContain(FALLBACK_CONTENT);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('404'),
      );
    });

    it('falls back to the static mark and logs when the logo fetch throws', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
      vi.stubGlobal('fetch', fetchMock);

      const response = await Icon();

      expect(await response.text()).toContain(FALLBACK_CONTENT);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('icon'),
      );
    });
  });

  it('falls back to the static mark when no logo is uploaded', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { logo: undefined } },
    });

    const response = await Icon();

    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(await response.text()).toContain(FALLBACK_CONTENT);
  });

  it('falls back to the static mark and logs when site settings fail to load', async () => {
    getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

    const response = await Icon();

    expect(await response.text()).toContain(FALLBACK_CONTENT);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('icon'),
    );
  });

  it('forwards the resolved tenant Sanity context to getSiteSettings', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { logo: undefined } },
    });

    await Icon();

    expect(getSiteSettingsMock).toHaveBeenCalledWith(tenant);
  });

  it('falls back to the static mark without calling site settings when the host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });

    const response = await Icon();

    expect(await response.text()).toContain(FALLBACK_CONTENT);
    expect(getSiteSettingsMock).not.toHaveBeenCalled();
  });
});
