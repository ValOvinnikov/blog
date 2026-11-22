import {
  type IMarketingSiteSource,
  toMarketingSiteUrl,
} from '@platform/utils/marketing-site-url/marketing-site-url';
import {
  LEGAL_PAGE_KIND,
  routes,
  type TMaybeUndefined,
} from '@shinefold/config';

export type TLegalPageUrls = {
  terms: string;
  privacy: string;
};

export const toLegalPageUrls = (
  source: IMarketingSiteSource,
): TMaybeUndefined<TLegalPageUrls> => {
  const siteUrl = toMarketingSiteUrl(source);
  if (!siteUrl) return undefined;

  return {
    terms: new URL(routes.legalPageByKind(LEGAL_PAGE_KIND.TERMS), siteUrl).href,
    privacy: new URL(
      routes.legalPageByKind(LEGAL_PAGE_KIND.PRIVACY_POLICY),
      siteUrl,
    ).href,
  };
};
