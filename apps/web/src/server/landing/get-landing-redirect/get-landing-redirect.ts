import type { TMaybeUndefined } from '@blog/config';
import { service, type TLandingRedirect } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';

export const getLandingRedirect = async (
  path: string,
): Promise<TResult<TMaybeUndefined<TLandingRedirect>>> => {
  const { sanityContext } = await getRequestContext();
  return service.pages.landing.v1.getRedirect(path.split('/'), sanityContext);
};
