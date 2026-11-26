import { faker } from '@faker-js/faker';
import { LANGUAGE_SWITCHER_STYLE } from '@shinefold/config';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { getSiteConfigMock } from '@web/testing/server/site-config/site-config-row-edges';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

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

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to the menu with code', async () => {
      await expect(getLanguageSwitcherStyle(MOCK_TENANT_ID)).resolves.toBe(
        LANGUAGE_SWITCHER_STYLE.MENU_CODE,
      );
    });

    it('logs the failure', async () => {
      await getLanguageSwitcherStyle(MOCK_TENANT_ID);

      expect(logger.error).toHaveBeenCalledWith(
        SITE_CONFIG_LOG.LANGUAGE_SWITCHER_STYLE_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
