import { env } from '@admin/utils/env/env';
import { sanitizeLogMessage } from '@admin/utils/sanitize-log-message/sanitize-log-message';

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
export async function revalidateSiteConfig(): Promise<void> {
  const { WEB_APP_URL: webAppUrl, SITE_CONFIG_REVALIDATE_SECRET: secret } = env;

  if (!webAppUrl || !secret) {
    console.error(
      'Skipped site-config revalidation webhook: WEB_APP_URL or SITE_CONFIG_REVALIDATE_SECRET is not configured.',
    );
    return;
  }

  try {
    const response = await fetch(new URL(REVALIDATE_PATH, webAppUrl), {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(SITE_CONFIG_REVALIDATE_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `Site-config revalidation webhook responded with ${response.status}.`,
      );
    }
  } catch (error) {
    console.error(
      'Failed to call the site-config revalidation webhook:',
      sanitizeLogMessage(error),
    );
  }
}
