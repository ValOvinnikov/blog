import type { TMaybeUndefined } from '@shinefold/config/types';

export const toMarketingHost = (
  marketingSiteUrl: TMaybeUndefined<string>,
): TMaybeUndefined<string> =>
  marketingSiteUrl ? new URL(marketingSiteUrl).hostname : undefined;
