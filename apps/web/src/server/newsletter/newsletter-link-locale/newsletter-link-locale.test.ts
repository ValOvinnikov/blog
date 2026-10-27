import { LOCALE_ISO_CODES } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { mockNewsletterLinkLocale } from '@web/testing/server/newsletter/newsletter-link-locale/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveNewsletterLinkLocale } from './newsletter-link-locale';

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      selectLiveLocales: ({
        locale,
        additionalLocales,
      }: Pick<TTenant, 'locale' | 'additionalLocales'>) => [
        locale,
        ...additionalLocales,
      ],
    },
  },
}));

const MOCK_LOOKUP_FAILED_EVENT = 'newsletter.link_locale_tenant_lookup_failed';

describe(resolveNewsletterLinkLocale, () => {
  it('keeps a language the tenant offers', async () => {
    const linkLocale = await resolveNewsletterLinkLocale(LOCALE_ISO_CODES.NL);

    expect(linkLocale).toEqual(
      mockNewsletterLinkLocale({ locale: LOCALE_ISO_CODES.NL }),
    );
  });

  it.each([null, '', LOCALE_ISO_CODES.DE, LOCALE_ISO_CODES.NL.toLowerCase()])(
    "falls back to the tenant's default language for %j",
    async (lang) => {
      const linkLocale = await resolveNewsletterLinkLocale(lang);

      expect(linkLocale).toEqual(mockNewsletterLinkLocale());
    },
  );

  it('falls back to the default language when no tenant matches the request', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

    const linkLocale = await resolveNewsletterLinkLocale(LOCALE_ISO_CODES.NL);

    expect(linkLocale).toEqual(mockNewsletterLinkLocale());
  });

  it('falls back to the default language and warns when the lookup fails', async () => {
    vi.mocked(resolveRequestTenant).mockRejectedValueOnce(MOCK_ERROR);

    const linkLocale = await resolveNewsletterLinkLocale(LOCALE_ISO_CODES.NL);

    expect(linkLocale).toEqual(mockNewsletterLinkLocale());
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      MOCK_LOOKUP_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
  });
});
