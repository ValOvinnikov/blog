import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

const REVALIDATE_PATH = '/api/revalidate-site-config';
const SITE_CONFIG_REVALIDATE_TIMEOUT_MS = 5000;

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
