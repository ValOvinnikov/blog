import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_COOKIE_SETTINGS_HEADING,
  MOCK_COOKIE_SETTINGS_MODULE_ID,
  mockRawCookieSettingsModule,
} from '@blog/service/testing/modules/fixtures';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';

import { getCookieSettings } from './loader';
import { cookieSettingsModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

describe(getCookieSettings, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawCookieSettingsModule());
  });

  it('maps the cookie settings module document', async () => {
    const module = await getCookieSettings(
      MOCK_COOKIE_SETTINGS_MODULE_ID,
      MOCK_TENANT,
    );

    expect(module.headingBlock?.heading).toBe(MOCK_COOKIE_SETTINGS_HEADING);
  });

  it('queries the module by id for the tenant with its cache tags', async () => {
    await getCookieSettings(MOCK_COOKIE_SETTINGS_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(cookieSettingsModuleQuery, {
      parameters: { id: MOCK_COOKIE_SETTINGS_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:cookieSettings'),
          mockCacheTag(`module:${MOCK_COOKIE_SETTINGS_MODULE_ID}`),
        ],
      },
    });
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getCookieSettings(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });
});
