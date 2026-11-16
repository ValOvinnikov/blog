import { faker } from '@faker-js/faker';
import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import { THEME_TOKENS_LOG } from '@web/constants/theme-tokens';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { toThemeTokens } from '@web/utils/to-theme-tokens';

import { getThemeTokens } from './get-theme-tokens';

faker.seed(115);

const MOCK_ERROR = new Error(faker.lorem.sentence());

const MOCK_SITE_CONFIG_ROW = mockSiteConfig({
  preset: PRESET_ID.EDITORIAL,
  ...PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens,
});

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

describe(getThemeTokens, () => {
  describe('when the site config fetch succeeds', () => {
    beforeEach(() => {
      vi.mocked(getSiteConfig).mockResolvedValueOnce(
        okResult(MOCK_SITE_CONFIG_ROW),
      );
    });

    it('resolves theme tokens from the site config row', async () => {
      const tokens = await getThemeTokens();

      expect(tokens).toEqual(toThemeTokens(MOCK_SITE_CONFIG_ROW));
    });

    it('reads the site config of the tenant it is given', async () => {
      await getThemeTokens(MOCK_TENANT_ID);

      expect(getSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });
  });

  it('falls back to the default preset tokens and logs when the fetch fails', async () => {
    vi.mocked(getSiteConfig).mockResolvedValueOnce(errorResult(MOCK_ERROR));

    const tokens = await getThemeTokens();

    expect(tokens).toEqual(toThemeTokens(undefined));
    expect(logger.error).toHaveBeenCalledWith(
      THEME_TOKENS_LOG.SITE_CONFIG_FETCH_FAILED,
      {
        error: MOCK_ERROR,
      },
    );
  });
});
