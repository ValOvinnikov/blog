import { LOCALE_ISO_CODES } from '@blog/config';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';

import { resolveNewsletterLinkLocale } from './newsletter-link-locale';

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      selectLiveLocales: (tenant: { liveLocales: string[] }) =>
        tenant.liveLocales,
    },
  },
}));

const resolveRequestTenantMock = vi.mocked(resolveRequestTenant);

describe(resolveNewsletterLinkLocale, () => {
  beforeEach(() => {
    resolveRequestTenantMock.mockReset();
    resolveRequestTenantMock.mockResolvedValue({
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.FR],
    } as never);
  });

  it('keeps a language the tenant offers', async () => {
    await expect(
      resolveNewsletterLinkLocale(LOCALE_ISO_CODES.FR),
    ).resolves.toEqual({
      locale: LOCALE_ISO_CODES.FR,
      defaultLocale: LOCALE_ISO_CODES.NL,
    });
  });

  it.each([null, '', LOCALE_ISO_CODES.DE, 'fr', 'xx'])(
    "falls back to the tenant's default language for %j",
    async (lang) => {
      await expect(resolveNewsletterLinkLocale(lang)).resolves.toEqual({
        locale: LOCALE_ISO_CODES.NL,
        defaultLocale: LOCALE_ISO_CODES.NL,
      });
    },
  );

  it('falls back to English when no tenant matches the request', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    await expect(
      resolveNewsletterLinkLocale(LOCALE_ISO_CODES.FR),
    ).resolves.toEqual({
      locale: LOCALE_ISO_CODES.EN,
      defaultLocale: LOCALE_ISO_CODES.EN,
    });
  });

  it('falls back to English when the tenant lookup fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveRequestTenantMock.mockRejectedValue(new Error('db down'));

    await expect(
      resolveNewsletterLinkLocale(LOCALE_ISO_CODES.FR),
    ).resolves.toEqual({
      locale: LOCALE_ISO_CODES.EN,
      defaultLocale: LOCALE_ISO_CODES.EN,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.link_locale_tenant_lookup_failed'),
    );
    warnSpy.mockRestore();
  });
});
