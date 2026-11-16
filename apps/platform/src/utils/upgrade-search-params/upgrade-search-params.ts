import { UPGRADE_SEARCH_PARAM } from '@platform/constants/billing';
import type { TSearchParam } from '@shinefold/config/types';
import type { TValueOf } from '@shinefold/config/utils';
import { isString } from '@shinefold/utils/primitives';

export type TUpgradeSearchParams = Partial<
  Record<TValueOf<typeof UPGRADE_SEARCH_PARAM>, TSearchParam>
>;

export type TUpgradeQuery = {
  promo?: string;
  isReturning: boolean;
};

export const parseUpgradeSearchParams = (
  searchParams: TUpgradeSearchParams,
): TUpgradeQuery => {
  const promo = searchParams[UPGRADE_SEARCH_PARAM.PROMO];
  return {
    promo: isString(promo) ? promo : undefined,
    isReturning: Boolean(searchParams[UPGRADE_SEARCH_PARAM.SESSION_ID]),
  };
};
