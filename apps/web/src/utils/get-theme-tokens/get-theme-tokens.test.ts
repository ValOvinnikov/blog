import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { toThemeTokens } from '@web/utils/to-theme-tokens';

import { getThemeTokens } from './get-theme-tokens';

faker.seed(115);

const SITE_CONFIG_FETCH_FAILED_EVENT = 'theme_tokens.site_config_fetch_failed';
const {
  themeTokens: EDITORIAL_TOKENS,
  cardStyle,
  headerControlStyle,
} = PRESET_REGISTRY[PRESET_ID.EDITORIAL];
const MOCK_ERROR = new Error(faker.lorem.sentence());

const MOCK_SITE_CONFIG_ROW = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: EDITORIAL_TOKENS.accentHue,
  headingFont: EDITORIAL_TOKENS.headingFont,
  bodyFont: EDITORIAL_TOKENS.bodyFont,
  radiusScale: EDITORIAL_TOKENS.radiusScale,
  density: EDITORIAL_TOKENS.density,
  cardStyle,
  headerControlStyle,
};

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

describe(getThemeTokens, () => {
  it('resolves theme tokens from the site config row on success', async () => {
    vi.mocked(getSiteConfig).mockResolvedValueOnce(
      okResult(MOCK_SITE_CONFIG_ROW as never),
    );

    const tokens = await getThemeTokens();

    expect(tokens).toEqual(toThemeTokens(MOCK_SITE_CONFIG_ROW));
  });

  it('reads the site config of the tenant it is given', async () => {
    vi.mocked(getSiteConfig).mockResolvedValueOnce(
      okResult(MOCK_SITE_CONFIG_ROW as never),
    );

    await getThemeTokens(MOCK_TENANT_ID);

    expect(getSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('falls back to the default preset tokens and logs when the fetch fails', async () => {
    vi.mocked(getSiteConfig).mockResolvedValueOnce(errorResult(MOCK_ERROR));

    const tokens = await getThemeTokens();

    expect(tokens).toEqual(toThemeTokens(undefined));
    expect(logger.error).toHaveBeenCalledWith(SITE_CONFIG_FETCH_FAILED_EVENT, {
      error: MOCK_ERROR,
    });
  });
});
