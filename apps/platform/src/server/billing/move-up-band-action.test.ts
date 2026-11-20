import {
  BILLING_LOG,
  MOVE_UP_QUOTE_MAX_AGE_SECONDS,
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
import {
  MOCK_BAND_CEILING,
  MOCK_HIGHER_BAND_CEILING,
  MOCK_LARGEST_BAND_CEILING,
  MOCK_PAYMENT_CLIENT_SECRET,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import { mockPayingSiteContext } from '@platform/testing/billing/paying-site';
import {
  MOCK_BAND_ITEM_ID,
  MOCK_PLAN_ITEM_ID,
  MOCK_SCHEDULE_ID,
  mockPlanSchedule,
  priceIdFor,
} from '@platform/testing/billing/plan-subscription';
import { mockStripeClientWithSubscription } from '@platform/testing/billing/stripe-plan-change-client';
import { mockOperatorViewer } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  ADMIN_ROLE,
  STRIPE_PRICE_LOOKUP_KEY,
  SUBSCRIBER_BAND_CEILINGS,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';

import { moveUpSubscriberBandAction } from './move-up-band-action';
import { toStripeTime } from './stripe-time';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('./stripe-client');

const GROWTH_SITE = mockPayingSiteContext({ plan: TENANT_PLAN.GROWTH });

const withSubscription = (
  overrides: Parameters<typeof mockStripeClientWithSubscription>[0] = {},
) =>
  mockStripeClientWithSubscription({
    lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
    ...overrides,
  });

const moveUpTo = (
  ceiling: TPaidSubscriberBandCeiling,
  prorationDate = toStripeTime(new Date()),
) => moveUpSubscriberBandAction(MOCK_TENANT_ID, { ceiling, prorationDate });

describe(moveUpSubscriberBandAction, () => {
  let client: ReturnType<typeof withSubscription>;

  beforeEach(() => {
    vi.mocked(requireTenantMembership).mockResolvedValue(GROWTH_SITE);
    client = withSubscription();
  });

  it('adds the first band to an included-band site, invoicing now', async () => {
    const prorationDate = toStripeTime(new Date());

    const result = await moveUpTo(MOCK_BAND_CEILING, prorationDate);

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
        proration_date: prorationDate,
      }),
    );
  });

  it('swaps the band for the next one on the yearly period', async () => {
    client = withSubscription({
      lookupKeys: [
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY,
      ],
    });

    await moveUpTo(MOCK_HIGHER_BAND_CEILING);

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

    const result = await moveUpTo(MOCK_BAND_CEILING);

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
      MOCK_HIGHER_BAND_CEILING,
    ],
    [
      'the largest band',
      [
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_25000,
      ],
      MOCK_LARGEST_BAND_CEILING,
    ],
    [
      'a Starter site',
      [STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY],
      MOCK_BAND_CEILING,
    ],
  ])('refuses %s without charging', async (_case, lookupKeys, ceiling) => {
    client = withSubscription({ lookupKeys });

    const result = await moveUpTo(ceiling);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.NO_NEXT_BAND,
    });
    expect(client.updateSubscription).not.toHaveBeenCalled();
  });

  it('refuses while a plan change waits for renewal', async () => {
    client = withSubscription({
      schedule: mockPlanSchedule([STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY]),
    });

    const result = await moveUpTo(MOCK_BAND_CEILING);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.PENDING_CHANGE,
    });
    expect(client.updateSubscription).not.toHaveBeenCalled();
  });

  it('moves up and releases a schedule left from a change already made', async () => {
    const schedule = mockPlanSchedule([STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY]);
    client = withSubscription({ schedule });
    client.updateSubscription.mockResolvedValue({ schedule: MOCK_SCHEDULE_ID });

    const result = await moveUpTo(MOCK_BAND_CEILING);

    expect(result).toMatchObject({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(client.releaseSchedule).toHaveBeenCalledWith(MOCK_SCHEDULE_ID);
  });

  it('refuses a quote older than its window without charging', async () => {
    const stale = toStripeTime(new Date()) - MOVE_UP_QUOTE_MAX_AGE_SECONDS - 1;

    const result = await moveUpTo(MOCK_BAND_CEILING, stale);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.QUOTE_EXPIRED,
    });
    expect(client.updateSubscription).not.toHaveBeenCalled();
  });

  it('refuses the included band as invalid', async () => {
    const [includedBand] = SUBSCRIBER_BAND_CEILINGS;

    const result = await moveUpSubscriberBandAction(MOCK_TENANT_ID, {
      ceiling: includedBand,
    } as unknown as Parameters<typeof moveUpSubscriberBandAction>[1]);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
  });

  it("hands back the payment's client secret when the bank asks for a step", async () => {
    client.holdForPayment(STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION);

    const result = await moveUpTo(MOCK_BAND_CEILING);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      timing: PLAN_CHANGE_TIMING.NOW,
      clientSecret: MOCK_PAYMENT_CLIENT_SECRET,
    });
  });

  it('says the card was declined when the payment needs another card', async () => {
    client.holdForPayment(STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_PAYMENT_METHOD);

    const result = await moveUpTo(MOCK_BAND_CEILING);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLAN_CHANGE_REFUSAL.CARD_DECLINED,
    });
  });

  it('logs and charges nothing when the band has no price', async () => {
    client.listPrices.mockResolvedValue({ data: [] });

    const result = await moveUpTo(MOCK_BAND_CEILING);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(client.updateSubscription).not.toHaveBeenCalled();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PLAN_CHANGE_PRICE_MISSING,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
