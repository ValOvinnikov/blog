import type { TThemeTokens } from '@blog/config';
import { getSiteConfig } from '@web/server/site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import { toThemeTokens } from '@web/utils/to-theme-tokens';

/**
 * Resolves the tenant's full theme tokens from the `@blog/db`-backed
 * `site_config` row — the single read shared by every caller that needs
 * `chromeOn`/font/accent-hue tokens, so a config change (e.g. an operator
 * flipping the Look tab's preset) is visible everywhere the same way. Falls
 * back to the Console preset's own tokens on a fetch failure.
 */
export async function getThemeTokens(): Promise<TThemeTokens> {
  const result = await getSiteConfig();

  if (!result.ok) {
    logger.error('theme_tokens.site_config_fetch_failed', {
      error: result.error,
    });
    return toThemeTokens(undefined);
  }

  return toThemeTokens(result.data);
}
