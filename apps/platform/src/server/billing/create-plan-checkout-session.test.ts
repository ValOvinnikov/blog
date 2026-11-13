import { TENANT_PLAN } from '@blog/config/constants';
import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  STRIPE_TENANT_METADATA_KEY,
} from '@platform/constants/billing';
import {
  MOCK_CHECKOUT_CLIENT_SECRET,
  MOCK_CHECKOUT_RETURN_URL,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_PRICE_ID,
  MOCK_STRIPE_PROMOTION_CODE,
  MOCK_STRIPE_PROMOTION_CODE_ID,
} from '@platform/testing/billing/fixtures';
import { mockStripeCheckoutClient } from '@platform/testing/billing/stripe-checkout-client';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import {
  createPlanCheckoutSession,
  type TPlanCheckoutRequest,
} from './create-plan-checkout-session';

const { stripe, listPrices, listPromotionCodes, createSession } =
  mockStripeCheckoutClient();

const MOCK_METADATA = { [STRIPE_TENANT_METADATA_KEY]: MOCK_TENANT_ID };
const MOCK_PROMOTION_DISCOUNTS = [
  { promotion_code: MOCK_STRIPE_PROMOTION_CODE_ID },
];

const request = (
  overrides: Partial<TPlanCheckoutRequest> = {},
): TPlanCheckoutRequest => ({
  tenantId: MOCK_TENANT_ID,
  customerId: MOCK_STRIPE_CUSTOMER_ID,
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.MONTHLY,
  returnUrl: MOCK_CHECKOUT_RETURN_URL,
  ...overrides,
});

const sessionParams = (call = 0) =>
  createSession.mock.calls[call]?.[0] as Record<string, unknown>;

const findsPromotionCode = () =>
  listPromotionCodes.mockResolvedValueOnce({
    data: [{ id: MOCK_STRIPE_PROMOTION_CODE_ID }],
  });

describe(createPlanCheckoutSession, () => {
  it("opens an embedded subscription checkout with tax for the site's customer", async () => {
    const clientSecret = await createPlanCheckoutSession(stripe, request());

    expect(clientSecret).toBe(MOCK_CHECKOUT_CLIENT_SECRET);
    expect(sessionParams()).toEqual({
      ui_mode: 'embedded_page',
      mode: 'subscription',
      line_items: [{ price: MOCK_STRIPE_PRICE_ID, quantity: 1 }],
      automatic_tax: { enabled: true },
      customer: MOCK_STRIPE_CUSTOMER_ID,
      customer_update: { address: 'auto', name: 'auto' },
      client_reference_id: MOCK_TENANT_ID,
      metadata: MOCK_METADATA,
      subscription_data: { metadata: MOCK_METADATA },
      return_url: MOCK_CHECKOUT_RETURN_URL,
      allow_promotion_codes: true,
    });
  });

  it.each([
    [
      TENANT_PLAN.STARTER,
      BILLING_INTERVAL.MONTHLY,
      STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
    ],
    [
      TENANT_PLAN.STARTER,
      BILLING_INTERVAL.YEARLY,
      STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY,
    ],
    [
      TENANT_PLAN.GROWTH,
      BILLING_INTERVAL.MONTHLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    ],
    [
      TENANT_PLAN.GROWTH,
      BILLING_INTERVAL.YEARLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
    ],
  ])('charges the %s %s price', async (plan, interval, lookupKey) => {
    await createPlanCheckoutSession(stripe, request({ plan, interval }));

    expect(listPrices).toHaveBeenCalledWith({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });
  });

  it('offers the code field when the promotion code is unknown', async () => {
    await createPlanCheckoutSession(
      stripe,
      request({ promo: MOCK_STRIPE_PROMOTION_CODE }),
    );

    const { discounts, allow_promotion_codes } = sessionParams();
    expect(discounts).toBeUndefined();
    expect(allow_promotion_codes).toBe(true);
  });

  describe('with an active promotion code', () => {
    beforeEach(() => {
      findsPromotionCode();
    });

    it('applies an active promotion code and hides the code field', async () => {
      await createPlanCheckoutSession(
        stripe,
        request({ promo: MOCK_STRIPE_PROMOTION_CODE }),
      );

      const { discounts, allow_promotion_codes } = sessionParams();
      expect(listPromotionCodes).toHaveBeenCalledWith({
        code: MOCK_STRIPE_PROMOTION_CODE,
        active: true,
        limit: 1,
      });
      expect(discounts).toEqual(MOCK_PROMOTION_DISCOUNTS);
      expect(allow_promotion_codes).toBeUndefined();
    });

    it('retries with the code field and logs when Stripe refuses the code', async () => {
      createSession.mockRejectedValueOnce(new Error());

      const clientSecret = await createPlanCheckoutSession(
        stripe,
        request({ promo: MOCK_STRIPE_PROMOTION_CODE }),
      );

      const { discounts, allow_promotion_codes } = sessionParams(1);
      const [event, context] = vi.mocked(logger).warn.mock.calls[0]!;
      expect(clientSecret).toBe(MOCK_CHECKOUT_CLIENT_SECRET);
      expect(discounts).toBeUndefined();
      expect(allow_promotion_codes).toBe(true);
      expect(event).toBe(BILLING_LOG.CHECKOUT_PROMO_REFUSED);
      expect(context?.promo).toBe(MOCK_STRIPE_PROMOTION_CODE);
    });
  });

  it('opens checkout with the code field when the code lookup fails', async () => {
    listPromotionCodes.mockRejectedValueOnce(new Error());

    const clientSecret = await createPlanCheckoutSession(
      stripe,
      request({ promo: MOCK_STRIPE_PROMOTION_CODE }),
    );

    const [event] = vi.mocked(logger).warn.mock.calls[0]!;
    expect(clientSecret).toBe(MOCK_CHECKOUT_CLIENT_SECRET);
    expect(sessionParams().allow_promotion_codes).toBe(true);
    expect(event).toBe(BILLING_LOG.CHECKOUT_PROMO_REFUSED);
  });

  it('opens no checkout and logs when Stripe has no price for the plan', async () => {
    listPrices.mockResolvedValueOnce({ data: [] });

    const clientSecret = await createPlanCheckoutSession(stripe, request());

    expect(clientSecret).toBeUndefined();
    expect(createSession).not.toHaveBeenCalled();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.CHECKOUT_PRICE_MISSING,
      {
        tenantId: MOCK_TENANT_ID,
        plan: TENANT_PLAN.GROWTH,
        interval: BILLING_INTERVAL.MONTHLY,
      },
    );
  });

  it('logs a session that comes back without a client secret', async () => {
    createSession.mockResolvedValueOnce({ client_secret: null });

    const clientSecret = await createPlanCheckoutSession(stripe, request());

    expect(clientSecret).toBeUndefined();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.CHECKOUT_FAILED,
      { tenantId: MOCK_TENANT_ID, hasClientSecret: false },
    );
  });
});
