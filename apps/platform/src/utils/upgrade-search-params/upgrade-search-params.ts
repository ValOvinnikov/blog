import type { TSearchParam } from '@blog/config/types';
import type { TValueOf } from '@blog/config/utils';
import { isString } from '@blog/utils/primitives';
import { UPGRADE_SEARCH_PARAM } from '@platform/constants/billing';

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
