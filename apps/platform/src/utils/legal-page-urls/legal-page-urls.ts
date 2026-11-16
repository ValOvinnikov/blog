import { tenantSiteUrl } from '@platform/utils/routes/routes';
import {
  LEGAL_PAGE_KIND,
  routes,
  type TMaybeUndefined,
} from '@shinefold/config';

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
    terms: `${siteUrl}${routes.legalPageByKind(LEGAL_PAGE_KIND.TERMS)}`,
    privacy: `${siteUrl}${routes.legalPageByKind(LEGAL_PAGE_KIND.PRIVACY_POLICY)}`,
  };
};
