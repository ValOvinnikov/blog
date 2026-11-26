import {
  HEADER_ACTION_PHONE_PLACEMENT,
  HEADER_ACTION_STYLE,
} from '@shinefold/config';
import { HEADER_ACTION_LOG } from '@web/constants/header-action';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { getSiteConfigMock } from '@web/testing/server/site-config/site-config-row-edges';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_HEADER_ACTION_LOOK } from '@web/testing/shared/header-action/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getHeaderActionLook } from './get-header-action-look';

describe(getHeaderActionLook, () => {
  it("returns the tenant's saved action style and phone placement", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        headerActionStyle: HEADER_ACTION_STYLE.OUTLINED,
        headerActionPhonePlacement: HEADER_ACTION_PHONE_PLACEMENT.BAR,
      }),
    );

    await expect(getHeaderActionLook(MOCK_TENANT_ID)).resolves.toEqual({
      style: HEADER_ACTION_STYLE.OUTLINED,
      phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.BAR,
    });
  });

  it('falls back to the preset action when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getHeaderActionLook(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_HEADER_ACTION_LOOK,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to the preset action', async () => {
      await expect(getHeaderActionLook(MOCK_TENANT_ID)).resolves.toEqual(
        MOCK_HEADER_ACTION_LOOK,
      );
    });

    it('logs the failure', async () => {
      await getHeaderActionLook(MOCK_TENANT_ID);

      expect(logger.error).toHaveBeenCalledWith(
        HEADER_ACTION_LOG.SITE_CONFIG_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
