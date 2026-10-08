import { LOCALE_ISO_CODES, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';

import { buildNotFoundMetadata } from './build-not-found-metadata';

vi.mock('@web/utils/resolve-tenant-messages', () => ({
  resolveTenantMessages: vi.fn(),
}));

const TENANT_ID = 'tenant-1';

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

    expect(metadata).toEqual({
      title: 'Page not found',
      description: "The page you're looking for doesn't exist.",
    });
    expect(resolveTenantMessages).not.toHaveBeenCalled();
  });

  it('uses the tenant’s voice overrides for heading and supporting text', async () => {
    vi.mocked(resolveTenantMessages).mockResolvedValue(
      withNotFoundOverrides('Lost at sea', 'Nothing lives at this address.'),
    );

    const metadata = await buildNotFoundMetadata({
      tenant: TENANT_ID,
      locale: LOCALE_ISO_CODES.EN,
    });

    expect(metadata).toEqual({
      title: 'Lost at sea',
      description: 'Nothing lives at this address.',
    });
    expect(resolveTenantMessages).toHaveBeenCalledWith(
      SITE_MESSAGES_BY_LOCALE.EN,
      LOCALE_ISO_CODES.EN,
      TENANT_ID,
    );
  });

  it('resolves the tenant’s overrides in the served language', async () => {
    vi.mocked(resolveTenantMessages).mockResolvedValue(
      withNotFoundOverrides('Verdwaald', 'Hier woont niets.'),
    );

    const metadata = await buildNotFoundMetadata({
      tenant: TENANT_ID,
      locale: LOCALE_ISO_CODES.NL,
    });

    expect(metadata).toEqual({
      title: 'Verdwaald',
      description: 'Hier woont niets.',
    });
    expect(resolveTenantMessages).toHaveBeenCalledWith(
      SITE_MESSAGES_BY_LOCALE.NL,
      LOCALE_ISO_CODES.NL,
      TENANT_ID,
    );
  });
});
