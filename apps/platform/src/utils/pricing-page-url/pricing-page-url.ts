import {
  type IMarketingSiteSource,
  toMarketingSiteUrl,
} from '@platform/utils/marketing-site-url/marketing-site-url';
import { pricingPageUrl, type TMaybeUndefined } from '@shinefold/config';

export const toPricingPageUrl = (
  source: IMarketingSiteSource,
): TMaybeUndefined<string> => {
  const siteUrl = toMarketingSiteUrl(source);

  return siteUrl ? pricingPageUrl(siteUrl) : undefined;
};
