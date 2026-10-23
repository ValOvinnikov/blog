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

    expect(metadata).toEqual({
      title: 'Page not found',
      description: "The page you're looking for doesn't exist.",
    });
    expect(resolveTenantMessages).not.toHaveBeenCalled();
  });

  it('uses the tenant’s voice overrides for heading and supporting text', async () => {
    vi.mocked(resolveTenantMessages).mockResolvedValue(
      withNotFoundOverrides(EN_HEADING, EN_SUPPORTING_TEXT),
    );

    const metadata = await buildNotFoundMetadata({
      tenant: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.EN,
    });

    expect(metadata).toEqual({
      title: EN_HEADING,
      description: EN_SUPPORTING_TEXT,
    });
    expect(resolveTenantMessages).toHaveBeenCalledWith(
      SITE_MESSAGES_BY_LOCALE.EN,
      LOCALE_ISO_CODES.EN,
      MOCK_TENANT_ID,
    );
  });

  it('resolves the tenant’s overrides in the served language', async () => {
    vi.mocked(resolveTenantMessages).mockResolvedValue(
      withNotFoundOverrides(NL_HEADING, NL_SUPPORTING_TEXT),
    );

    const metadata = await buildNotFoundMetadata({
      tenant: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.NL,
    });

    expect(metadata).toEqual({
      title: NL_HEADING,
      description: NL_SUPPORTING_TEXT,
    });
    expect(resolveTenantMessages).toHaveBeenCalledWith(
      SITE_MESSAGES_BY_LOCALE.NL,
      LOCALE_ISO_CODES.NL,
      MOCK_TENANT_ID,
    );
  });
});
