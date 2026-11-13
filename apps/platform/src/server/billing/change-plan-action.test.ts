import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { MEMBERSHIP_ROLE, STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  STRIPE_SUBSCRIPTION_STATUS,
  UPGRADE_STATE,
} from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import { mockPlanSubscription } from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import Stripe from 'stripe';

import { changePlanAction } from './change-plan-action';
import { getStripeClient } from './stripe-client';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('./stripe-client', () => ({ getStripeClient: vi.fn() }));

const TO_GROWTH: TPlanChoice = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.MONTHLY,
};
const MOCK_PAYING_SITE = {
  plan: TENANT_PLAN.STARTER,
  stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
};

const siteFor = (
  tenant: Parameters<typeof mockReadyTenant>[0] = MOCK_PAYING_SITE,
  membership = mockMembership(),
) => ({
  tenant: mockReadyTenant({ id: MOCK_TENANT_ID, ...tenant }),
  membership,
});

const withSubscription = (
  overrides: Partial<Parameters<typeof mockPlanSubscription>[0]> = {},
) => {
  const client = mockStripePlanChangeClient(
    mockPlanSubscription({
      planKey: STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
      ...overrides,
    }),
  );
  vi.mocked(getStripeClient).mockReturnValue(client.stripe);
  return client;
};

describe(changePlanAction, () => {
  let client: ReturnType<typeof withSubscription>;

  beforeEach(() => {
    vi.mocked(requireTenantMembership).mockResolvedValue(siteFor());
    client = withSubscription();
  });

  it('moves the owner of a Starter site to Growth now', async () => {
    const result = await changePlanAction(MOCK_TENANT_ID, TO_GROWTH);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      timing: PLAN_CHANGE_TIMING.NOW,
    });
    expect(client.updateSubscription).toHaveBeenCalledOnce();
  });

  it.each([
    ['a Free site', {}, mockMembership(), PLAN_CHANGE_REFUSAL.NOT_SUBSCRIBED],
    [
      'a member who is not the owner',
      MOCK_PAYING_SITE,
      mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      UPGRADE_STATE.NOT_OWNER,
    ],
  ])(
    'refuses %s without calling Stripe',
    async (_case, tenant, membership, reason) => {
      vi.mocked(requireTenantMembership).mockResolvedValueOnce(
        siteFor(tenant, membership),
      );
      const result = await changePlanAction(MOCK_TENANT_ID, TO_GROWTH);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
      expect(client.retrieveSubscription).not.toHaveBeenCalled();
    },
  );

  it('refuses a subscription that is past due', async () => {
    const { updateSubscription } = withSubscription({
      status: STRIPE_SUBSCRIPTION_STATUS.PAST_DUE,
    });

    const result = await changePlanAction(MOCK_TENANT_ID, TO_GROWTH);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.NOT_ACTIVE,
    });
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it('refuses a free plan as invalid', async () => {
    const result = await changePlanAction(MOCK_TENANT_ID, {
      ...TO_GROWTH,
      plan: TENANT_PLAN.FREE,
    } as unknown as TPlanChoice);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
  });

  it('says the card was declined without logging', async () => {
    client.updateSubscription.mockRejectedValue(
      new Stripe.errors.StripeCardError({ message: 'declined' }),
    );

    const result = await changePlanAction(MOCK_TENANT_ID, TO_GROWTH);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.CARD_DECLINED,
    });
    expect(vi.mocked(logger).error).not.toHaveBeenCalled();
  });

  it('logs any other Stripe failure', async () => {
    client.updateSubscription.mockRejectedValue(new Error('network'));

    const result = await changePlanAction(MOCK_TENANT_ID, TO_GROWTH);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PLAN_CHANGE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
