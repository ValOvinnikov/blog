import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { getSiteConfigMock } from '@web/testing/server/site-config/site-config-row-edges';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getSiteConfigRow } from './get-site-config-row';

const MOCK_ROW = mockSiteConfig();
const MOCK_LOG_CONTEXT = { tenantId: MOCK_TENANT_ID };

describe(getSiteConfigRow, () => {
  it("returns the tenant's site_config row", async () => {
    getSiteConfigMock.mockResolvedValue(MOCK_ROW);

    await expect(
      getSiteConfigRow(SITE_CONFIG_LOG.FETCH_FAILED, MOCK_TENANT_ID),
    ).resolves.toEqual(MOCK_ROW);
    expect(logger.error).not.toHaveBeenCalled();
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('returns no row', async () => {
      await expect(
        getSiteConfigRow(SITE_CONFIG_LOG.FETCH_FAILED, MOCK_TENANT_ID),
      ).resolves.toBeUndefined();
    });

    it('logs the failure event with the given context', async () => {
      await getSiteConfigRow(
        SITE_CONFIG_LOG.FETCH_FAILED,
        MOCK_TENANT_ID,
        MOCK_LOG_CONTEXT,
      );

      expect(logger.error).toHaveBeenCalledWith(SITE_CONFIG_LOG.FETCH_FAILED, {
        ...MOCK_LOG_CONTEXT,
        error: MOCK_ERROR,
      });
    });
  });
});
