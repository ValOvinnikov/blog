import {
  BILLING_LOG,
  STRIPE_PRORATION_BEHAVIOR,
  UPGRADE_STATE,
} from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
} from '@platform/constants/plan-change';
import {
  STRIPE_PAYMENT_BEHAVIOR,
  STRIPE_PAYMENT_INTENT_STATUS,
} from '@platform/constants/stripe-payment';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import {
  MOCK_BAND_ITEM_ID,
  MOCK_PLAN_ITEM_ID,
  MOCK_SCHEDULE_ID,
  priceIdFor,
} from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import { mockStripeSubscription } from '@platform/testing/billing/stripe-subscription';
import {
  mockMembershipContext,
  mockOperatorViewer,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  ADMIN_ROLE,
  STRIPE_PRICE_LOOKUP_KEY,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';

import { moveUpSubscriberBandAction } from './move-up-band-action';
import { getStripeClient } from './stripe-client';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('./stripe-client');

const GROWTH_SITE = mockMembershipContext(
  mockReadyTenant({
    id: MOCK_TENANT_ID,
    plan: TENANT_PLAN.GROWTH,
    stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
  }),
);

const withSubscription = (
  lookupKeys: string[] = [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
  schedule: string | null = null,
) => {
  const client = mockStripePlanChangeClient(
    mockStripeSubscription({ lookupKeys, schedule }),
  );
  vi.mocked(getStripeClient).mockReturnValue(client.stripe);
  return client;
};

const moveUpTo = (ceiling: TPaidSubscriberBandCeiling) =>
  moveUpSubscriberBandAction(MOCK_TENANT_ID, { ceiling });

describe(moveUpSubscriberBandAction, () => {
  let client: ReturnType<typeof withSubscription>;

  beforeEach(() => {
    vi.mocked(requireTenantMembership).mockResolvedValue(GROWTH_SITE);
    client = withSubscription();
  });

  it('adds the first band to an included-band site, invoicing now', async () => {
    const result = await moveUpTo(2_500);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      timing: PLAN_CHANGE_TIMING.NOW,
    });
    expect(client.updateSubscription).toHaveBeenCalledWith(
      MOCK_STRIPE_SUBSCRIPTION_ID,
      expect.objectContaining({
        items: [
          {
            id: MOCK_PLAN_ITEM_ID,
            price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY),
          },
          { price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500) },
        ],
        proration_behavior: STRIPE_PRORATION_BEHAVIOR.ALWAYS_INVOICE,
        payment_behavior: STRIPE_PAYMENT_BEHAVIOR.PENDING_IF_INCOMPLETE,
      }),
    );
  });

  it('swaps the band for the next one on the yearly period', async () => {
    client = withSubscription([
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY,
    ]);

    await moveUpTo(5_000);

    expect(client.updateSubscription).toHaveBeenCalledWith(
      MOCK_STRIPE_SUBSCRIPTION_ID,
      expect.objectContaining({
        items: [
          {
            id: MOCK_PLAN_ITEM_ID,
            price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY),
          },
          {
            id: MOCK_BAND_ITEM_ID,
            price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000_YEARLY),
          },
        ],
      }),
    );
  });

  it('refuses an operator without calling Stripe', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce({
      ...GROWTH_SITE,
      viewer: mockOperatorViewer(ADMIN_ROLE.SUPERADMIN),
    });

    const result = await moveUpTo(2_500);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPGRADE_STATE.NOT_OWNER,
    });
    expect(client.retrieveSubscription).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a band other than the next one',
      [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
      5_000,
    ],
    [
      'the largest band',
      [
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_25000,
      ],
      25_000,
    ],
    ['a Starter site', [STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY], 2_500],
  ] as const)(
    'refuses %s without charging',
    async (_case, lookupKeys, ceiling) => {
      client = withSubscription([...lookupKeys]);

      const result = await moveUpTo(ceiling);

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: PLAN_CHANGE_REFUSAL.NO_NEXT_BAND,
      });
      expect(client.updateSubscription).not.toHaveBeenCalled();
    },
  );

  it('refuses while a plan change waits for renewal', async () => {
    client = withSubscription(
      [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
      MOCK_SCHEDULE_ID,
    );

    const result = await moveUpTo(2_500);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.PENDING_CHANGE,
    });
    expect(client.updateSubscription).not.toHaveBeenCalled();
  });

  it('refuses a band outside the catalogue as invalid', async () => {
    const result = await moveUpSubscriberBandAction(MOCK_TENANT_ID, {
      ceiling: 1_000,
    } as unknown as { ceiling: TPaidSubscriberBandCeiling });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
  });

  it("hands back the payment's client secret when the bank asks for a step", async () => {
    client.holdForPayment(STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION);

    const result = await moveUpTo(2_500);

    expect(result).toMatchObject({
      outcome: ACTION_OUTCOME.SUCCESS,
      clientSecret: expect.any(String),
    });
  });

  it('says the card was declined when the payment needs another card', async () => {
    client.holdForPayment(STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_PAYMENT_METHOD);

    const result = await moveUpTo(2_500);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.CARD_DECLINED,
    });
  });

  it('logs and charges nothing when the band has no price', async () => {
    client.listPrices.mockResolvedValue({ data: [] });

    const result = await moveUpTo(2_500);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(client.updateSubscription).not.toHaveBeenCalled();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PLAN_CHANGE_PRICE_MISSING,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
