import { ACTION_OUTCOME } from '@blog/config';
import type { TCreateUpgradeCheckoutResult } from '@platform/server/billing/create-upgrade-checkout-action';
import { MOCK_CHECKOUT_CLIENT_SECRET } from '@platform/testing/billing/fixtures';

export const createUpgradeCheckoutAction = vi.fn(
  async (): Promise<TCreateUpgradeCheckoutResult> => ({
    outcome: ACTION_OUTCOME.SUCCESS,
    clientSecret: MOCK_CHECKOUT_CLIENT_SECRET,
  }),
);
