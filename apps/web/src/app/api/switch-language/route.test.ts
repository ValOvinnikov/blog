import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { NextRequest } from 'next/server';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const {
  resolveRequestTenantMock,
  isPlatformFallbackAllowedMock,
  selectLiveLocalesMock,
  getTenantTranslationMapMock,
} = vi.hoisted(() => ({
  resolveRequestTenantMock: vi.fn(),
  isPlatformFallbackAllowedMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
  getTenantTranslationMapMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { selectLiveLocales: selectLiveLocalesMock } },
}));
vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));
vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  isPlatformFallbackAllowed: isPlatformFallbackAllowedMock,
}));
vi.mock(
  '@web/server/translation-map/get-tenant-translation-map/get-tenant-translation-map',
  () => ({ getTenantTranslationMap: getTenantTranslationMapMock }),
);

const { GET } = await import('./route');

const tenant = { id: 'tenant-1', locale: EN } as TTenant;

const translationMap = {
  homeLanguages: [],
  groups: [
    [
      { documentType: 'page_landing', language: EN, slug: 'about' },
      { documentType: 'page_landing', language: NL, slug: 'over-ons' },
    ],
  ],
};

const switchTo = (to: string, from: string) =>
  GET(
    new NextRequest(
      `https://acme.example.com/api/switch-language?${new URLSearchParams({ to, from }).toString()}`,
    ),
  );

const serveTenant = (liveLocales: TLocaleIsoCode[]) => {
  resolveRequestTenantMock.mockResolvedValue(tenant);
  selectLiveLocalesMock.mockReturnValue(liveLocales);
};

describe('GET /api/switch-language', () => {
  beforeEach(() => {
    resolveRequestTenantMock.mockReset();
    isPlatformFallbackAllowedMock.mockReset();
    isPlatformFallbackAllowedMock.mockReturnValue(false);
    selectLiveLocalesMock.mockReset();
    getTenantTranslationMapMock.mockReset();
    getTenantTranslationMapMock.mockResolvedValue(translationMap);
    serveTenant([EN, NL, FR]);
  });

  it("redirects to the current page's translation and remembers the language", async () => {
    const response = await switchTo(NL, '/about');

    expect(response.headers.get('location')).toBe(
      'https://acme.example.com/nl/over-ons',
    );
    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe(NL);
    expect(getTenantTranslationMapMock).toHaveBeenCalledWith(tenant);
  });

  it('forbids any cache from storing the redirect', async () => {
    const response = await switchTo(NL, '/about');

    expect(response.status).toBe(307);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it("redirects to the language's home page when the page has no translation", async () => {
    const response = await switchTo(FR, '/about');

    expect(response.headers.get('location')).toBe(
      'https://acme.example.com/fr',
    );
  });

  it('falls back to the home page when the map cannot be loaded', async () => {
    getTenantTranslationMapMock.mockResolvedValue(undefined);

    const response = await switchTo(NL, '/about');

    expect(response.headers.get('location')).toBe(
      'https://acme.example.com/nl',
    );
  });

  it('rejects a language the tenant does not serve', async () => {
    serveTenant([EN, NL]);

    const response = await switchTo(FR, '/about');

    expect(response.status).toBe(400);
    expect(response.cookies.get('NEXT_LOCALE')).toBeUndefined();
  });

  it('rejects a current page off this site', async () => {
    const response = await switchTo(NL, '//evil.example/about');

    expect(response.status).toBe(400);
  });

  it('keeps a single-language tenant on the same page without loading the map', async () => {
    serveTenant([EN]);

    const response = await switchTo(EN, '/about');

    expect(response.headers.get('location')).toBe(
      'https://acme.example.com/about',
    );
    expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
  });

  it('404s in production when no tenant serves the host', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    const response = await switchTo(EN, '/about');

    expect(response.status).toBe(404);
  });
});
