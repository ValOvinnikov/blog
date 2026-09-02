import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

const REVALIDATE_PATH = '/api/revalidate-site-config';
const SITE_CONFIG_REVALIDATE_TIMEOUT_MS = 5000;

/**
 * Best-effort call to `apps/web`'s on-demand revalidation endpoint after a
 * Look/Voice save writes `site_config`, so the change appears live within
 * seconds instead of the fallback cache window. Never throws — a failure
 * here (missing config, network error, non-2xx response) is logged and
 * swallowed, since the calling save has already succeeded and that fallback
 * window remains the safety net either way.
 */
export const revalidateSiteConfig = async (tenantId: string): Promise<void> => {
  const { WEB_APP_URL: webAppUrl, SITE_CONFIG_REVALIDATE_SECRET: secret } = env;

  if (!webAppUrl || !secret) {
    logger.error('site_config.revalidate_skipped');
    return;
  }

  try {
    const response = await fetch(new URL(REVALIDATE_PATH, webAppUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId }),
      signal: AbortSignal.timeout(SITE_CONFIG_REVALIDATE_TIMEOUT_MS),
    });

    if (!response.ok) {
      logger.error('site_config.revalidate_failed', {
        responseStatus: response.status,
      });
    }
  } catch (error) {
    logger.error('site_config.revalidate_error', { error });
  }
};
