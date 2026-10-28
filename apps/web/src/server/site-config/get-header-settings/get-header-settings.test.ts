import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
} from '@blog/config';
import { queries } from '@blog/db';
import { HEADER_SETTINGS_LOG } from '@web/constants/header-settings';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_HEADER_SETTINGS } from '@web/testing/shared/header-settings/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getHeaderSettings } from './get-header-settings';

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

describe(getHeaderSettings, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the tenant's saved layout, sub-menu style and bar", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        headerLayout: HEADER_LAYOUT.TWO_ROWS,
        headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
        headerBarStyle: HEADER_BAR_STYLE.FLOATING,
      }),
    );

    await expect(getHeaderSettings(MOCK_TENANT_ID)).resolves.toEqual({
      layout: HEADER_LAYOUT.TWO_ROWS,
      submenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
      barStyle: HEADER_BAR_STYLE.FLOATING,
    });
  });

  it('falls back to the classic dropdown full-width header when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getHeaderSettings(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_HEADER_SETTINGS,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to the classic dropdown full-width header', async () => {
      await expect(getHeaderSettings(MOCK_TENANT_ID)).resolves.toEqual(
        MOCK_HEADER_SETTINGS,
      );
    });

    it('logs the failure', async () => {
      await getHeaderSettings(MOCK_TENANT_ID);

      expect(logger.error).toHaveBeenCalledWith(
        HEADER_SETTINGS_LOG.SITE_CONFIG_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
