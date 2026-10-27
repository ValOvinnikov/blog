import { LOCALE_ISO_CODES, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';

import { buildNotFoundMetadata } from './build-not-found-metadata';

vi.mock('@web/utils/resolve-tenant-messages', () => ({
  resolveTenantMessages: vi.fn(),
}));

faker.seed(5201);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

const withNotFoundOverrides = (): Awaited<
  ReturnType<typeof resolveTenantMessages>
> => {
  const base = SITE_MESSAGES_BY_LOCALE.EN;

  return {
    messages: {
      ...base,
      notFound: {
        ...base.notFound,
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      },
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

  it.each([LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL])(
    'uses the tenant’s %s voice overrides for the title and description',
    async (locale) => {
      vi.mocked(resolveTenantMessages).mockResolvedValue(
        withNotFoundOverrides(),
      );

      const metadata = await buildNotFoundMetadata({
        tenant: MOCK_TENANT_ID,
        locale,
      });

      expect(metadata).toEqual({
        title: MOCK_HEADING,
        description: MOCK_SUPPORTING_TEXT,
      });
      expect(resolveTenantMessages).toHaveBeenCalledWith(
        SITE_MESSAGES_BY_LOCALE[locale],
        locale,
        MOCK_TENANT_ID,
      );
    },
  );
});
