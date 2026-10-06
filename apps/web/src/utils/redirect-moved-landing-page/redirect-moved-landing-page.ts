import type { TMaybeUndefined } from '@blog/config';
import type { TResult } from '@blog/utils';
import { permanentRedirect } from '@web/i18n/navigation';
import { getLandingRedirect } from '@web/server/landing/get-landing-redirect/get-landing-redirect';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

export const redirectMovedLandingPage = async <T>(
  result: TResult<TMaybeUndefined<T>>,
  path: string,
): Promise<void> => {
  if (!result.ok || result.data) return;

  const redirect = await getLandingRedirect(path);

  if (!redirect.ok) {
    logger.error('landing_redirect.fetch_failed', {
      path,
      error: redirect.error,
    });
    return;
  }

  if (!redirect.data) return;

  const { locale } = await getRequestContext();
  permanentRedirect({ href: redirect.data, locale });
};
