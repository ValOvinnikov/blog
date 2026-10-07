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
      hasVoiceOverrides: true,
    });

    expect(metadata).toEqual({
      title: 'Lost at sea',
      description: 'Nothing lives at this address.',
    });
    expect(resolveTenantMessages).toHaveBeenCalledWith(
      SITE_MESSAGES_BY_LOCALE.EN,
      TENANT_ID,
    );
  });

  it('reads the served language’s copy and ignores overrides outside the default language', async () => {
    const metadata = await buildNotFoundMetadata({
      tenant: TENANT_ID,
      locale: LOCALE_ISO_CODES.NL,
      hasVoiceOverrides: false,
    });

    expect(metadata).toEqual({
      title: SITE_MESSAGES_BY_LOCALE.NL.notFound.heading,
      description: SITE_MESSAGES_BY_LOCALE.NL.notFound.supportingText,
    });
    expect(resolveTenantMessages).not.toHaveBeenCalled();
  });
});
