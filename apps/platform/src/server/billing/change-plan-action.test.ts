import {
  BILLING_LOG,
  STRIPE_SUBSCRIPTION_STATUS,
  UPGRADE_STATE,
} from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { STRIPE_PAYMENT_INTENT_STATUS } from '@platform/constants/stripe-payment';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_PAYMENT_CLIENT_SECRET } from '@platform/testing/billing/fixtures';
import { mockPayingSiteContext } from '@platform/testing/billing/paying-site';
import { MOCK_GROWTH_MONTHLY_CHOICE } from '@platform/testing/billing/plan-choices';
import { mockStripeClientWithSubscription } from '@platform/testing/billing/stripe-plan-change-client';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, HTTP_STATUS } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  MEMBERSHIP_ROLE,
  STRIPE_PRICE_LOOKUP_KEY,
} from '@shinefold/db/constants';
import Stripe from 'stripe';

import { changePlanAction } from './change-plan-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('./stripe-client');

const withSubscription = (
  overrides: Parameters<typeof mockStripeClientWithSubscription>[0] = {},
) =>
  mockStripeClientWithSubscription({
    lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY],
    ...overrides,
  });

describe(changePlanAction, () => {
  let client: ReturnType<typeof withSubscription>;

  beforeEach(() => {
    vi.mocked(requireTenantMembership).mockResolvedValue(
      mockPayingSiteContext(),
    );
    client = withSubscription();
  });

  it('moves the owner of a Starter site to Growth now', async () => {
    const result = await changePlanAction(
      MOCK_TENANT_ID,
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      timing: PLAN_CHANGE_TIMING.NOW,
    });
    expect(client.updateSubscription).toHaveBeenCalledOnce();
  });

  it.each([
    [
      'a Free site',
      { plan: TENANT_PLAN.FREE, stripeSubscriptionId: null },
      mockMembership(),
      PLAN_CHANGE_REFUSAL.NOT_SUBSCRIBED,
    ],
    [
      'a member who is not the owner',
      {},
      mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      UPGRADE_STATE.NOT_OWNER,
    ],
  ])(
    'refuses %s without calling Stripe',
    async (_case, tenant, membership, reason) => {
      vi.mocked(requireTenantMembership).mockResolvedValueOnce(
        mockPayingSiteContext(tenant, membership),
      );
      const result = await changePlanAction(
        MOCK_TENANT_ID,
        MOCK_GROWTH_MONTHLY_CHOICE,
      );

      expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
      expect(client.retrieveSubscription).not.toHaveBeenCalled();
    },
  );

  it('refuses a subscription that is past due', async () => {
    const { updateSubscription } = withSubscription({
      status: STRIPE_SUBSCRIPTION_STATUS.PAST_DUE,
    });

    const result = await changePlanAction(
      MOCK_TENANT_ID,
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.NOT_ACTIVE,
    });
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it('refuses a free plan as invalid', async () => {
    const result = await changePlanAction(MOCK_TENANT_ID, {
      ...MOCK_GROWTH_MONTHLY_CHOICE,
      plan: TENANT_PLAN.FREE,
    } as unknown as TPlanChoice);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
  });

  it("hands back the payment's client secret when the bank asks for a step", async () => {
    client.holdForPayment(STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION);

    const result = await changePlanAction(
      MOCK_TENANT_ID,
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      timing: PLAN_CHANGE_TIMING.NOW,
      clientSecret: MOCK_PAYMENT_CLIENT_SECRET,
    });
  });

  it('says the card was declined when the payment needs another card', async () => {
    client.holdForPayment(STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_PAYMENT_METHOD);

    const result = await changePlanAction(
      MOCK_TENANT_ID,
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.CARD_DECLINED,
    });
    expect(vi.mocked(logger).error).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a card error',
      new Stripe.errors.StripeCardError({ message: 'declined' }),
    ],
    [
      'a payment-required response',
      new Stripe.errors.StripeInvalidRequestError({
        message: 'payment required',
        statusCode: HTTP_STATUS.PAYMENT_REQUIRED,
      }),
    ],
  ])(
    'says the card was declined on %s without logging',
    async (_case, error) => {
      client.updateSubscription.mockRejectedValue(error);

      const result = await changePlanAction(
        MOCK_TENANT_ID,
        MOCK_GROWTH_MONTHLY_CHOICE,
      );

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: PLAN_CHANGE_REFUSAL.CARD_DECLINED,
      });
      expect(vi.mocked(logger).error).not.toHaveBeenCalled();
    },
  );

  it('logs any other Stripe failure', async () => {
    client.updateSubscription.mockRejectedValue(MOCK_NETWORK_ERROR);

    const result = await changePlanAction(
      MOCK_TENANT_ID,
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PLAN_CHANGE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
