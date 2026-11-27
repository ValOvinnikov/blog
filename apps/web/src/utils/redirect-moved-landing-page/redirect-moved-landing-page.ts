import { REDIRECT_STATUS, type TMaybeUndefined } from '@shinefold/config';
import type { TResult } from '@shinefold/utils';
import { LANDING_PAGE_LOG } from '@web/constants/landing-page';
import { getLandingRedirect } from '@web/server/landing/get-landing-redirect/get-landing-redirect';
import { localizeForRequest } from '@web/server/request-context/localize-for-request/localize-for-request';
import { logger } from '@web/utils/logger/logger';
import { permanentRedirect, redirect } from 'next/navigation';

export const redirectMovedLandingPage = async <T>(
  result: TResult<TMaybeUndefined<T>>,
  path: string,
): Promise<void> => {
  if (!result.ok || result.data) return;

  const landingRedirect = await getLandingRedirect(path);

  if (!landingRedirect.ok) {
    logger.error(LANDING_PAGE_LOG.REDIRECT_FETCH_FAILED, {
      path,
      error: landingRedirect.error,
    });
    return;
  }

  if (!landingRedirect.data) return;

  const { destination, status } = landingRedirect.data;
  const sendRedirect =
    status === REDIRECT_STATUS.TEMPORARY ? redirect : permanentRedirect;

  sendRedirect(await localizeForRequest(destination));
};
