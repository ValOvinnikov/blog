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

interface ILegalPageUrlsSource {
  marketingSiteUrl: TMaybeUndefined<string>;
  rootDomain: TMaybeUndefined<string>;
}

/** The terms and privacy pages live on the marketing site, which the root domain's apex serves unless its URL is configured. */
export const toLegalPageUrls = ({
  marketingSiteUrl,
  rootDomain,
}: ILegalPageUrlsSource): TMaybeUndefined<TLegalPageUrls> => {
  const siteUrl =
    marketingSiteUrl ?? (rootDomain ? tenantSiteUrl(rootDomain) : undefined);
  if (!siteUrl) return undefined;

  return {
    terms: new URL(routes.legalPageByKind(LEGAL_PAGE_KIND.TERMS), siteUrl).href,
    privacy: new URL(
      routes.legalPageByKind(LEGAL_PAGE_KIND.PRIVACY_POLICY),
      siteUrl,
    ).href,
  };
};
