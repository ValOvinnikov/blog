import { REDIRECT_STATUS, type TMaybeUndefined } from '@blog/config';
import type { TResult } from '@blog/utils';
import { permanentRedirect, redirect } from '@web/i18n/navigation';
import { getLandingRedirect } from '@web/server/landing/get-landing-redirect/get-landing-redirect';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

export const redirectMovedLandingPage = async <T>(
  result: TResult<TMaybeUndefined<T>>,
  path: string,
): Promise<void> => {
  if (!result.ok || result.data) return;

  const landingRedirect = await getLandingRedirect(path);

  if (!landingRedirect.ok) {
    logger.error('landing_redirect.fetch_failed', {
      path,
      error: landingRedirect.error,
    });
    return;
  }

  if (!landingRedirect.data) return;

  const { destination, status } = landingRedirect.data;
  const { locale } = await getRequestContext();
  const sendRedirect =
    status === REDIRECT_STATUS.TEMPORARY ? redirect : permanentRedirect;

  sendRedirect({ href: destination, locale });
};
