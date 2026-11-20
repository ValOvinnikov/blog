import {
  BILLING_LOG,
  STRIPE_PRORATION_BEHAVIOR,
} from '@platform/constants/billing';
import { PLAN_CHANGE_REFUSAL } from '@platform/constants/plan-change';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_BAND_2500_AMOUNT,
  MOCK_GROWTH_CATALOGUE,
  MOCK_GROWTH_MONTHLY_AMOUNT,
} from '@platform/testing/billing/catalogue-prices';
import {
  MOCK_AMOUNT_PAID,
  MOCK_STRIPE_CURRENCY,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import { MOCK_MOVE_UP_QUOTE } from '@platform/testing/billing/move-up';
import {
  MOCK_PLAN_ITEM_ID,
  MOCK_RENEWS_AT,
  priceIdFor,
} from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import { mockStripeSubscription } from '@platform/testing/billing/stripe-subscription';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import {
  mockMembershipContext,
  mockMembership,
} from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  BILLING_CURRENCY,
  MEMBERSHIP_ROLE,
  STRIPE_PRICE_LOOKUP_KEY,
} from '@shinefold/db/constants';
import type Stripe from 'stripe';

import { getMoveUpQuoteAction } from './get-move-up-quote-action';
import { getStripeClient } from './stripe-client';

const { listStripePricesMock } = vi.hoisted(() => ({
  listStripePricesMock: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { stripeCatalogue: { listStripePrices: listStripePricesMock } },
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('./stripe-client');

const MOCK_CARD = MOCK_MOVE_UP_QUOTE.card;

const growthSite = (
  overrides: Parameters<typeof mockReadyTenant>[0] = {},
  membership = mockMembership(),
) =>
  mockMembershipContext(
    mockReadyTenant({
      id: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
      stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
      billingCurrency: BILLING_CURRENCY.USD,
      ...overrides,
    }),
    membership,
  );

const quote = () => getMoveUpQuoteAction(MOCK_TENANT_ID, { ceiling: 2_500 });

describe(getMoveUpQuoteAction, () => {
  let client: ReturnType<typeof mockStripePlanChangeClient>;

  beforeEach(() => {
    vi.mocked(requireTenantMembership).mockResolvedValue(growthSite());
    const subscription = mockStripeSubscription();
    client = mockStripePlanChangeClient(subscription);
    client.retrieveSubscription.mockImplementation(async (_id, params) =>
      (params as Stripe.SubscriptionRetrieveParams).expand?.includes(
        'default_payment_method',
      )
        ? { ...subscription, default_payment_method: { card: MOCK_CARD } }
        : subscription,
    );
    vi.mocked(getStripeClient).mockReturnValue(client.stripe);
    listStripePricesMock.mockResolvedValue(MOCK_GROWTH_CATALOGUE);
  });

  it('quotes the amount due today, the renewal, the new total and the card', async () => {
    expect(await quote()).toEqual({
      ok: true,
      data: {
        dueToday: {
          minorUnits: MOCK_AMOUNT_PAID,
          currency: MOCK_STRIPE_CURRENCY,
        },
        renewsAt: MOCK_RENEWS_AT,
        total: {
          minorUnits: MOCK_GROWTH_MONTHLY_AMOUNT + MOCK_BAND_2500_AMOUNT,
          currency: BILLING_CURRENCY.USD,
        },
        card: MOCK_CARD,
      },
    });
  });

  it('previews the move as an immediate invoice without changing the subscription', async () => {
    await quote();

    expect(client.createInvoicePreview).toHaveBeenCalledWith({
      subscription: MOCK_STRIPE_SUBSCRIPTION_ID,
      subscription_details: {
        items: [
          {
            id: MOCK_PLAN_ITEM_ID,
            price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY),
          },
          { price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500) },
        ],
        proration_behavior: STRIPE_PRORATION_BEHAVIOR.ALWAYS_INVOICE,
      },
    });
    expect(client.updateSubscription).not.toHaveBeenCalled();
  });

  it('refuses a member who is not the owner without calling Stripe', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      growthSite({}, mockMembership({ role: MEMBERSHIP_ROLE.EDITOR })),
    );

    const result = await quote();

    expect(result.ok).toBe(false);
    expect(client.retrieveSubscription).not.toHaveBeenCalled();
  });

  it('says why when the band is not the next one', async () => {
    expect(
      await getMoveUpQuoteAction(MOCK_TENANT_ID, { ceiling: 5_000 }),
    ).toEqual({ ok: false, error: PLAN_CHANGE_REFUSAL.NO_NEXT_BAND });
  });

  it('quotes nothing for a site with no stored currency', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      growthSite({ billingCurrency: null }),
    );

    expect(await quote()).toEqual({ ok: false, error: undefined });
    expect(client.retrieveSubscription).not.toHaveBeenCalled();
  });

  it('logs and quotes nothing when the catalogue lacks the price', async () => {
    listStripePricesMock.mockResolvedValue([]);

    expect(await quote()).toEqual({ ok: false, error: undefined });
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PLAN_CHANGE_PRICE_MISSING,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('logs a failed preview', async () => {
    client.createInvoicePreview.mockRejectedValue(MOCK_NETWORK_ERROR);

    expect(await quote()).toEqual({ ok: false, error: undefined });
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.MOVE_UP_QUOTE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
