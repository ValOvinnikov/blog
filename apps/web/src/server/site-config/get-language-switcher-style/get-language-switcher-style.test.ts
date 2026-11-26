import { faker } from '@faker-js/faker';
import { LANGUAGE_SWITCHER_STYLE } from '@shinefold/config';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { getSiteConfigMock } from '@web/testing/server/site-config/site-config-row-edges';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { getLanguageSwitcherStyle } from './get-language-switcher-style';

faker.seed(6010);

describe(getLanguageSwitcherStyle, () => {
  it("returns the tenant's saved style", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES }),
    );

    await expect(getLanguageSwitcherStyle(MOCK_TENANT_ID)).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.CODES,
    );
  });

  it('falls back to the menu with code when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getLanguageSwitcherStyle(MOCK_TENANT_ID)).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    );
  });

  it('falls back to the menu with code when the site config read fails', async () => {
    getSiteConfigMock.mockRejectedValue(MOCK_ERROR);

    await expect(getLanguageSwitcherStyle(MOCK_TENANT_ID)).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    );
  });
});
