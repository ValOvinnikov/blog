import { COLOR_MODE, COLOR_SCHEME } from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getLockedColorScheme } from './get-locked-color-scheme';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

const getSiteConfigMock = vi.mocked(getSiteConfig);

describe(getLockedColorScheme, () => {
  it.each([
    [COLOR_MODE.DARK, COLOR_SCHEME.DARK],
    [COLOR_MODE.LIGHT, COLOR_SCHEME.LIGHT],
    [COLOR_MODE.READER, undefined],
  ])('locks a %s site to %s', async (colorMode, expected) => {
    getSiteConfigMock.mockResolvedValueOnce(
      okResult(mockSiteConfig({ colorMode })),
    );

    await expect(getLockedColorScheme(MOCK_TENANT_ID)).resolves.toBe(expected);
  });

  describe('with no site config', () => {
    beforeEach(() => {
      getSiteConfigMock.mockResolvedValueOnce(okResult(undefined));
    });

    it('reads the site config of the tenant it is given', async () => {
      await getLockedColorScheme(MOCK_TENANT_ID);

      expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });

    it('locks nothing', async () => {
      await expect(
        getLockedColorScheme(MOCK_TENANT_ID),
      ).resolves.toBeUndefined();
    });
  });

  it('locks nothing and logs when the site config read fails', async () => {
    getSiteConfigMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(getLockedColorScheme(MOCK_TENANT_ID)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.COLOR_MODE_FETCH_FAILED,
      { error: MOCK_ERROR },
    );
  });
});
