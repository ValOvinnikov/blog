import { UPGRADE_SEARCH_PARAM } from '@platform/constants/billing';
import {
  MOCK_CHECKOUT_SESSION_ID,
  MOCK_STRIPE_PROMOTION_CODE,
} from '@platform/testing/billing/fixtures';

import { parseUpgradeSearchParams } from './upgrade-search-params';

describe(parseUpgradeSearchParams, () => {
  it('reads a promotion code and a return from checkout', () => {
    const query = parseUpgradeSearchParams({
      [UPGRADE_SEARCH_PARAM.PROMO]: MOCK_STRIPE_PROMOTION_CODE,
      [UPGRADE_SEARCH_PARAM.SESSION_ID]: MOCK_CHECKOUT_SESSION_ID,
    });

    expect(query).toEqual({
      promo: MOCK_STRIPE_PROMOTION_CODE,
      isReturning: true,
    });
  });

  it('treats a first visit with no parameters as no promotion and no return', () => {
    expect(parseUpgradeSearchParams({})).toEqual({
      promo: undefined,
      isReturning: false,
    });
  });

  it('ignores a promotion code given more than once', () => {
    const query = parseUpgradeSearchParams({
      [UPGRADE_SEARCH_PARAM.PROMO]: [
        MOCK_STRIPE_PROMOTION_CODE,
        MOCK_STRIPE_PROMOTION_CODE,
      ],
    });

    expect(query.promo).toBeUndefined();
  });
});
