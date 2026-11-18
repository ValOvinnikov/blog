import { tenantSiteUrl } from '@platform/utils/routes/routes';
import type { TMaybeUndefined } from '@shinefold/config';

export interface IMarketingSiteSource {
  marketingSiteUrl: TMaybeUndefined<string>;
  rootDomain: TMaybeUndefined<string>;
}

/** The root domain's apex serves the marketing site unless its URL is configured. */
export const toMarketingSiteUrl = ({
  marketingSiteUrl,
  rootDomain,
}: IMarketingSiteSource): TMaybeUndefined<string> =>
  marketingSiteUrl ?? (rootDomain ? tenantSiteUrl(rootDomain) : undefined);
