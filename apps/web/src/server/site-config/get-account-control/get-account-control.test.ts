import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
} from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { ACCOUNT_CONTROL_LOG } from '@web/constants/account-control';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getAccountControl } from './get-account-control';

faker.seed(6061);

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock(
  '@blog/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

const DEFAULT_ACCOUNT_CONTROL = {
  buttonStyle: ACCOUNT_BUTTON_STYLE.PILL,
  panelStyle: ACCOUNT_PANEL_STYLE.CARD,
  phonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
};

describe(getAccountControl, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the tenant's saved button, panel and phone placement", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
        accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
        accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
      }),
    );

    await expect(getAccountControl(MOCK_TENANT_ID)).resolves.toEqual({
      buttonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
      panelStyle: ACCOUNT_PANEL_STYLE.HUB,
      phonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
    });
  });

  it('falls back to the pill, card and bar when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getAccountControl(MOCK_TENANT_ID)).resolves.toEqual(
      DEFAULT_ACCOUNT_CONTROL,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to the pill, card and bar', async () => {
      await expect(getAccountControl(MOCK_TENANT_ID)).resolves.toEqual(
        DEFAULT_ACCOUNT_CONTROL,
      );
    });

    it('logs the failure', async () => {
      await getAccountControl(MOCK_TENANT_ID);

      expect(logger.error).toHaveBeenCalledWith(
        ACCOUNT_CONTROL_LOG.SITE_CONFIG_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
