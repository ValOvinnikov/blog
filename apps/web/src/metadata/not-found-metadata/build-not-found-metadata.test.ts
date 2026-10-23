import { LOCALE_ISO_CODES, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';

import { buildNotFoundMetadata } from './build-not-found-metadata';

vi.mock('@web/utils/resolve-tenant-messages', () => ({
  resolveTenantMessages: vi.fn(),
}));

const EN_HEADING = 'Lost at sea';
const EN_SUPPORTING_TEXT = 'Nothing lives at this address.';
const NL_HEADING = 'Verdwaald';
const NL_SUPPORTING_TEXT = 'Hier woont niets.';

const withNotFoundOverrides = (
  heading: string,
  supportingText: string,
): Awaited<ReturnType<typeof resolveTenantMessages>> => {
  const base = SITE_MESSAGES_BY_LOCALE.EN;
  return {
    messages: {
      ...base,
      notFound: { ...base.notFound, heading, supportingText },
    },
    rich: {} as Awaited<ReturnType<typeof resolveTenantMessages>>['rich'],
  };
};

describe(buildNotFoundMetadata, () => {
  it('builds title and description from the base English copy by default', async () => {
    const metadata = await buildNotFoundMetadata();

    const { heading, supportingText } = SITE_MESSAGES_BY_LOCALE.EN.notFound;

    expect(metadata).toEqual({ title: heading, description: supportingText });
    expect(resolveTenantMessages).not.toHaveBeenCalled();
  });

  it.each([
    {
      locale: LOCALE_ISO_CODES.EN,
      heading: EN_HEADING,
      supportingText: EN_SUPPORTING_TEXT,
    },
    {
      locale: LOCALE_ISO_CODES.NL,
      heading: NL_HEADING,
      supportingText: NL_SUPPORTING_TEXT,
    },
  ])(
    'uses the tenant’s $locale voice overrides for the title and description',
    async ({ locale, heading, supportingText }) => {
      vi.mocked(resolveTenantMessages).mockResolvedValue(
        withNotFoundOverrides(heading, supportingText),
      );

      const metadata = await buildNotFoundMetadata({
        tenant: MOCK_TENANT_ID,
        locale,
      });

      expect(metadata).toEqual({ title: heading, description: supportingText });
      expect(resolveTenantMessages).toHaveBeenCalledWith(
        SITE_MESSAGES_BY_LOCALE[locale],
        locale,
        MOCK_TENANT_ID,
      );
    },
  );
});
