import { routes, type TMaybeUndefined } from '@blog/config';
import { tenantSiteUrl } from '@platform/utils/routes/routes';

export type TLegalPageUrls = {
  terms: string;
  privacy: string;
};

/** The terms and privacy pages live on the marketing site, which the apex serves. */
export const toLegalPageUrls = (
  rootDomain: TMaybeUndefined<string>,
): TMaybeUndefined<TLegalPageUrls> => {
  if (!rootDomain) return undefined;

  const siteUrl = tenantSiteUrl(rootDomain);
  return {
    terms: `${siteUrl}${routes.terms()}`,
    privacy: `${siteUrl}${routes.privacy()}`,
  };
};
