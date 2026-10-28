import { BUSY_BUTTON_STYLE, SPINNER_STYLE } from '@blog/config';
import { queries } from '@blog/db';
import { BUSY_STYLE_LOG } from '@web/constants/busy-style';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_BUSY_STYLE } from '@web/testing/shared/busy-style/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getBusyStyle } from './get-busy-style';

vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock('@web/server/settings-features/get-tenant-plan/get-tenant-plan');

vi.mock(
  '@blog/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

describe(getBusyStyle, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the tenant's saved busy style and spinner style", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
        spinnerStyle: SPINNER_STYLE.DOTS,
      }),
    );

    await expect(getBusyStyle(MOCK_TENANT_ID)).resolves.toEqual({
      busyStyle: BUSY_BUTTON_STYLE.EDGE,
      spinnerVariant: SPINNER_STYLE.DOTS,
    });
  });

  it('falls back to the busy label and the Braille spinner when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getBusyStyle(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_BUSY_STYLE,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to the busy label and the Braille spinner', async () => {
      await expect(getBusyStyle(MOCK_TENANT_ID)).resolves.toEqual(
        MOCK_BUSY_STYLE,
      );
    });

    it('logs the failure', async () => {
      await getBusyStyle(MOCK_TENANT_ID);

      expect(logger.error).toHaveBeenCalledWith(
        BUSY_STYLE_LOG.SITE_CONFIG_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
