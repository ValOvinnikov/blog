// @vitest-environment node
//
// `icon.tsx` runs the real `@sanity/image-url` transform (`buildImageUrl`)
// against `@blog/service`'s validated env module, which throws on any
// server-var access when `typeof window !== 'undefined'` (`@t3-oss/env-core`'s
// client/server guard) — the default jsdom environment defines `window`, so
// this file overrides to `node` to let that real transform run unmocked.
import {
  buildImageUrl,
  type TRawImage,
  type TTenantSanityContext,
} from '@blog/service';

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

vi.mock('@web/server/tenant/get-host-tenant-sanity-context', () => ({
  getHostTenantSanityContext: getHostTenantSanityContextMock,
}));

const logoAsset: TRawImage = {
  _type: 'imageWithAlt',
  asset: { _type: 'reference', _ref: 'image-abc123def-800x600-svg' },
  alt: 'Logo',
  hotspot: null,
  crop: null,
};
const brand = { logoAsset };
const FALLBACK_CONTENT = '.l1{fill:#2E6BD6}';

const DEFAULT_TENANT: TTenantSanityContext = {
  projectId: 'tenant-project',
  dataset: 'tenant-dataset',
  token: 'tenant-token',
};

// Computed via the real (unmocked) `buildImageUrl`/`urlForImage` transform,
// the same one `icon.tsx` must call — asserting against this, rather than a
// hand-typed string, is what would catch a regression back to building the
// URL against the wrong (e.g. platform) tenant project/dataset.
const EXPECTED_ICON_URL = buildImageUrl(logoAsset, DEFAULT_TENANT, {
  width: 64,
  height: 64,
  fit: 'crop',
});

describe('icon', () => {
  beforeEach(() => {
    getSiteSettingsMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: DEFAULT_TENANT,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds a real crop URL directly from the raw asset reference and fetches it', async () => {
    expect(EXPECTED_ICON_URL).toMatch(
      /^https:\/\/cdn\.sanity\.io\/images\/tenant-project\/tenant-dataset\/.+\?.*w=64.*h=64.*fit=crop/,
    );

    getSiteSettingsMock.mockResolvedValue({ ok: true, data: { brand } });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'image/webp' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { default: Icon } = await import('./icon');
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

  it('falls back to the static mark when no logo is uploaded', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { logoAsset: undefined } },
    });

    const { default: Icon } = await import('./icon');
    const response = await Icon();

    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(await response.text()).toContain(FALLBACK_CONTENT);
  });

  it('falls back to the static mark and logs when the logo fetch responds with a non-2xx status', async () => {
    getSiteSettingsMock.mockResolvedValue({ ok: true, data: { brand } });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { default: Icon } = await import('./icon');
    const response = await Icon();

    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(await response.text()).toContain(FALLBACK_CONTENT);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('404'),
    );
    consoleErrorSpy.mockRestore();
  });

  it('falls back to the static mark and logs when the logo fetch throws', async () => {
    getSiteSettingsMock.mockResolvedValue({ ok: true, data: { brand } });
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
    vi.stubGlobal('fetch', fetchMock);
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { default: Icon } = await import('./icon');
    const response = await Icon();

    expect(await response.text()).toContain(FALLBACK_CONTENT);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('icon'),
    );
    consoleErrorSpy.mockRestore();
  });

  it('falls back to the static mark and logs when site settings fail to load', async () => {
    getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { default: Icon } = await import('./icon');
    const response = await Icon();

    expect(await response.text()).toContain(FALLBACK_CONTENT);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('icon'),
    );
    consoleErrorSpy.mockRestore();
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
      data: { brand: { logoAsset: undefined } },
    });

    const { default: Icon } = await import('./icon');
    await Icon();

    expect(getSiteSettingsMock).toHaveBeenCalledWith(tenant);
  });

  it('falls back to the static mark without calling site settings when the host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });

    const { default: Icon } = await import('./icon');
    const response = await Icon();

    expect(await response.text()).toContain(FALLBACK_CONTENT);
    expect(getSiteSettingsMock).not.toHaveBeenCalled();
  });
});
