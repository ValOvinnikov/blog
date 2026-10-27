import {
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { mockTenant } from '@web/testing/shared/tenant/fixtures';
import { NextRequest } from 'next/server';

faker.seed(6009);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const {
  isPlatformFallbackAllowedMock,
  selectLiveLocalesMock,
  getTenantTranslationMapMock,
} = vi.hoisted(() => ({
  isPlatformFallbackAllowedMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
  getTenantTranslationMapMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { selectLiveLocales: selectLiveLocalesMock } },
}));
vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  isPlatformFallbackAllowed: isPlatformFallbackAllowedMock,
}));
vi.mock(
  '@web/server/translation-map/get-tenant-translation-map/get-tenant-translation-map',
  () => ({ getTenantTranslationMap: getTenantTranslationMapMock }),
);

const { GET } = await import('./route');

const tenant = mockTenant();
const MOCK_ORIGIN = `https://${faker.internet.domainName()}`;
const MOCK_PAGE_SLUG = faker.lorem.slug();
const MOCK_TRANSLATED_SLUG = faker.lorem.slug();
const MOCK_PAGE_PATH = `/${MOCK_PAGE_SLUG}`;
const MOCK_FOREIGN_PATH = `//${faker.internet.domainName()}${MOCK_PAGE_PATH}`;
const MOCK_PAGE_TYPE = 'page_landing';

const translationMap = {
  homeLanguages: [],
  postIndexLanguages: [],
  topicIndexLanguages: [],
  tagIndexLanguages: [],
  groups: [
    [
      { documentType: MOCK_PAGE_TYPE, language: EN, slug: MOCK_PAGE_SLUG },
      {
        documentType: MOCK_PAGE_TYPE,
        language: NL,
        slug: MOCK_TRANSLATED_SLUG,
      },
    ],
  ],
};

const switchTo = (to: string, from: string) =>
  GET(
    new NextRequest(
      `${MOCK_ORIGIN}/api/switch-language?${new URLSearchParams({ to, from }).toString()}`,
    ),
  );

const serveTenant = (liveLocales: TLocaleIsoCode[]) => {
  selectLiveLocalesMock.mockReturnValue(liveLocales);
};

describe(GET, () => {
  beforeEach(() => {
    isPlatformFallbackAllowedMock.mockReset();
    isPlatformFallbackAllowedMock.mockReturnValue(false);
    selectLiveLocalesMock.mockReset();
    getTenantTranslationMapMock.mockReset();
    getTenantTranslationMapMock.mockResolvedValue(translationMap);
    serveTenant([EN, NL, FR]);
  });

  it("redirects to the current page's translation and remembers the language", async () => {
    const response = await switchTo(NL, MOCK_PAGE_PATH);

    expect(response.headers.get('location')).toBe(
      `${MOCK_ORIGIN}/nl/${MOCK_TRANSLATED_SLUG}`,
    );
    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe(NL);
    expect(getTenantTranslationMapMock).toHaveBeenCalledWith(tenant);
  });

  it('forbids any cache from storing the redirect', async () => {
    const response = await switchTo(NL, MOCK_PAGE_PATH);

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it("redirects to the language's home page when the page has no translation", async () => {
    const response = await switchTo(FR, MOCK_PAGE_PATH);

    expect(response.headers.get('location')).toBe(`${MOCK_ORIGIN}/fr`);
  });

  it('falls back to the home page when the map cannot be loaded', async () => {
    getTenantTranslationMapMock.mockResolvedValue(undefined);

    const response = await switchTo(NL, MOCK_PAGE_PATH);

    expect(response.headers.get('location')).toBe(`${MOCK_ORIGIN}/nl`);
  });

  it('rejects a language the tenant does not serve', async () => {
    serveTenant([EN, NL]);

    const response = await switchTo(FR, MOCK_PAGE_PATH);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(response.cookies.get('NEXT_LOCALE')).toBeUndefined();
  });

  it('rejects a current page off this site', async () => {
    const response = await switchTo(NL, MOCK_FOREIGN_PATH);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  it('keeps a single-language tenant on the same page without the map', async () => {
    serveTenant([EN]);

    const response = await switchTo(EN, MOCK_PAGE_PATH);

    expect(response.headers.get('location')).toBe(
      `${MOCK_ORIGIN}${MOCK_PAGE_PATH}`,
    );
    expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
  });

  it('responds not found when no tenant serves the host', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

    const response = await switchTo(EN, MOCK_PAGE_PATH);

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  });
});
