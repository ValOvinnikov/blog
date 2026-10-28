import { LOCALE_ISO_CODES } from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockVoiceRichText } from '@web/testing/shared/voice/fixtures';
import { logger } from '@web/utils/logger/logger';
import { getMessages } from 'next-intl/server';

import { getVoiceRich } from './get-voice-rich';

faker.seed(6010);

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock(
  '@blog/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

vi.mock('next-intl/server', () => ({
  getMessages: vi.fn(),
}));

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

const FIELD_ID = 'blogListEmpty';
const MOCK_CATALOG_EMPTY = faker.lorem.sentence();
const MOCK_OVERRIDE_EN = mockVoiceRichText(faker.lorem.sentence());
const MOCK_OVERRIDE_DE = mockVoiceRichText(faker.lorem.sentence());

const MOCK_BASE_MESSAGES = {
  blogListPage: { empty: MOCK_CATALOG_EMPTY },
};

describe(getVoiceRich, () => {
  beforeEach(() => {
    vi.mocked(getMessages).mockReset();
    vi.mocked(getMessages).mockResolvedValue(MOCK_BASE_MESSAGES);
    getSiteConfigMock.mockReset();
    getSiteConfigMock.mockResolvedValue(mockSiteConfig());
  });

  it.each([
    [LOCALE_ISO_CODES.EN, MOCK_OVERRIDE_EN],
    [LOCALE_ISO_CODES.DE, MOCK_OVERRIDE_DE],
  ])(
    'returns the stored override in the request language %s',
    async (locale, expected) => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        locale,
      });
      getSiteConfigMock.mockResolvedValue(
        mockSiteConfig({
          voiceOverridesByLocale: {
            [LOCALE_ISO_CODES.EN]: { [FIELD_ID]: MOCK_OVERRIDE_EN },
            [LOCALE_ISO_CODES.DE]: { [FIELD_ID]: MOCK_OVERRIDE_DE },
          },
        }),
      );

      const result = await getVoiceRich(FIELD_ID);

      expect(result).toEqual(expected);
    },
  );

  it.each([
    ['no language has an override', {}],
    [
      'the request language has none of its own',
      { [LOCALE_ISO_CODES.EN]: { [FIELD_ID]: MOCK_OVERRIDE_EN } },
    ],
  ])(
    'returns the catalog default as one paragraph when %s',
    async (_, voiceOverridesByLocale) => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        locale: LOCALE_ISO_CODES.DE,
      });
      getSiteConfigMock.mockResolvedValue(
        mockSiteConfig({ voiceOverridesByLocale }),
      );

      const result = await getVoiceRich(FIELD_ID);

      expect(result[0]?.children[0]?.text).toBe(MOCK_CATALOG_EMPTY);
    },
  );

  it('falls back to the catalog default and logs when the site config fetch fails', async () => {
    getSiteConfigMock.mockRejectedValue(MOCK_ERROR);

    const result = await getVoiceRich(FIELD_ID);

    expect(result[0]?.children[0]?.text).toBe(MOCK_CATALOG_EMPTY);
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.VOICE_RICH_FETCH_FAILED,
      {
        id: FIELD_ID,
        error: MOCK_ERROR,
      },
    );
  });

  it("reads the site config of the request context's tenant", async () => {
    await getVoiceRich(FIELD_ID);

    expect(getRequestTenantId).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
    );
  });

  it('reads no tenant from the request headers when the route resolved no tenant', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await getVoiceRich(FIELD_ID);

    expect(getRequestTenantId).toHaveBeenCalledWith(
      UNRESOLVED_TENANT_PLACEHOLDER,
    );
  });
});
