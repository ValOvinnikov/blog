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
      locale: 'NL',
      liveLocales: ['NL', 'FR'],
    } as never);
  });

  it('keeps a language the tenant offers', async () => {
    await expect(resolveNewsletterLinkLocale('FR')).resolves.toBe('FR');
  });

  it.each([null, '', 'DE', 'fr', 'xx'])(
    "falls back to the tenant's default language for %j",
    async (lang) => {
      await expect(resolveNewsletterLinkLocale(lang)).resolves.toBe('NL');
    },
  );

  it('falls back to English when no tenant matches the request', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    await expect(resolveNewsletterLinkLocale('FR')).resolves.toBe('EN');
  });

  it('falls back to English when the tenant lookup fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveRequestTenantMock.mockRejectedValue(new Error('db down'));

    await expect(resolveNewsletterLinkLocale('FR')).resolves.toBe('EN');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.link_locale_tenant_lookup_failed'),
    );
    warnSpy.mockRestore();
  });
});
