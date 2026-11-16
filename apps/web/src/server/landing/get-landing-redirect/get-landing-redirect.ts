import type { TMaybeUndefined } from '@shinefold/config';
import { service, type TLandingRedirect } from '@shinefold/service';
import type { TResult } from '@shinefold/utils';
import { getRequestContext } from '@web/server/request-context/request-context';

export const getLandingRedirect = async (
  path: string,
): Promise<TResult<TMaybeUndefined<TLandingRedirect>>> => {
  const { sanityContext } = await getRequestContext();
  return service.pages.landing.v1.getRedirect(path.split('/'), sanityContext);
};
