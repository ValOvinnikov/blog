const { getSiteSettingsMock } = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
}));

const { urlForImageMock } = vi.hoisted(() => ({
  urlForImageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
    },
  },
  urlForImage: urlForImageMock,
}));

const brand = { logoUrl: 'https://cdn.sanity.io/images/test/brand.svg' };
const FALLBACK_CONTENT = '.l1{fill:#2E6BD6}';

describe('icon', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    urlForImageMock.mockReturnValue(
      'https://cdn.sanity.io/images/test/brand.svg?w=64&h=64&fit=crop',
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the uploaded logo through when one is set, passing the CDN Content-Type through', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand },
    });
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
      'https://cdn.sanity.io/images/test/brand.svg?w=64&h=64&fit=crop',
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
      data: { brand: { logoUrl: undefined } },
    });

    const { default: Icon } = await import('./icon');
    const response = await Icon();

    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(await response.text()).toContain(FALLBACK_CONTENT);
  });

  it('falls back to the static mark when the logo fetch fails', async () => {
    getSiteSettingsMock.mockResolvedValue({ ok: true, data: { brand } });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const { default: Icon } = await import('./icon');
    const response = await Icon();

    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(await response.text()).toContain(FALLBACK_CONTENT);
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
});
