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
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

import {
  createGrowthCheckoutSession,
  type TGrowthCheckoutRequest,
} from './create-growth-checkout-session';

const { listPricesMock, listPromotionCodesMock, createSessionMock } =
  vi.hoisted(() => ({
    listPricesMock: vi.fn(),
    listPromotionCodesMock: vi.fn(),
    createSessionMock: vi.fn(),
  }));

const MOCK_STRIPE = {
  prices: { list: listPricesMock },
  promotionCodes: { list: listPromotionCodesMock },
  checkout: { sessions: { create: createSessionMock } },
} as unknown as Stripe;

const NEW_CUSTOMER_TENANT = { id: MOCK_TENANT_ID, stripeCustomerId: null };
const METADATA = { [STRIPE_TENANT_METADATA_KEY]: MOCK_TENANT_ID };

const request = (
  overrides: Partial<TGrowthCheckoutRequest> = {},
): TGrowthCheckoutRequest => ({
  tenant: NEW_CUSTOMER_TENANT,
  interval: BILLING_INTERVAL.MONTHLY,
  returnUrl: MOCK_CHECKOUT_RETURN_URL,
  email: MOCK_OWNER_EMAIL,
  ...overrides,
});

const createdSession = () => createSessionMock.mock.calls[0]?.[0];

describe(createGrowthCheckoutSession, () => {
  beforeEach(() => {
    listPricesMock.mockResolvedValue({ data: [{ id: MOCK_STRIPE_PRICE_ID }] });
    listPromotionCodesMock.mockResolvedValue({ data: [] });
    createSessionMock.mockResolvedValue({
      client_secret: MOCK_CHECKOUT_CLIENT_SECRET,
    });
  });

  it('opens an embedded Growth subscription checkout with tax for a new customer', async () => {
    const clientSecret = await createGrowthCheckoutSession(
      MOCK_STRIPE,
      request(),
    );

    expect(clientSecret).toBe(MOCK_CHECKOUT_CLIENT_SECRET);
    expect(createdSession()).toEqual({
      ui_mode: 'embedded_page',
      mode: 'subscription',
      line_items: [{ price: MOCK_STRIPE_PRICE_ID, quantity: 1 }],
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      customer_email: MOCK_OWNER_EMAIL,
      client_reference_id: MOCK_TENANT_ID,
      metadata: METADATA,
      subscription_data: { metadata: METADATA },
      return_url: MOCK_CHECKOUT_RETURN_URL,
    });
  });

  it.each([
    [BILLING_INTERVAL.MONTHLY, STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
    [BILLING_INTERVAL.YEARLY, STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY],
  ])('charges the %s Growth price', async (interval, lookupKey) => {
    await createGrowthCheckoutSession(MOCK_STRIPE, request({ interval }));

    expect(listPricesMock).toHaveBeenCalledWith({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });
  });

  it('reuses a stored customer and keeps its address current for tax', async () => {
    await createGrowthCheckoutSession(
      MOCK_STRIPE,
      request({
        tenant: {
          id: MOCK_TENANT_ID,
          stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
        },
      }),
    );

    const { customer, customer_update, customer_email } = createdSession();
    expect(customer).toBe(MOCK_STRIPE_CUSTOMER_ID);
    expect(customer_update).toEqual({ address: 'auto', name: 'auto' });
    expect(customer_email).toBeUndefined();
  });

  it('applies an active promotion code and hides the code field', async () => {
    listPromotionCodesMock.mockResolvedValueOnce({
      data: [{ id: MOCK_STRIPE_PROMOTION_CODE_ID }],
    });

    await createGrowthCheckoutSession(
      MOCK_STRIPE,
      request({ promo: MOCK_STRIPE_PROMOTION_CODE }),
    );

    const { discounts, allow_promotion_codes } = createdSession();
    expect(listPromotionCodesMock).toHaveBeenCalledWith({
      code: MOCK_STRIPE_PROMOTION_CODE,
      active: true,
      limit: 1,
    });
    expect(discounts).toEqual([
      { promotion_code: MOCK_STRIPE_PROMOTION_CODE_ID },
    ]);
    expect(allow_promotion_codes).toBeUndefined();
  });

  it('offers the code field when the promotion code is unknown', async () => {
    await createGrowthCheckoutSession(
      MOCK_STRIPE,
      request({ promo: MOCK_STRIPE_PROMOTION_CODE }),
    );

    const { discounts, allow_promotion_codes } = createdSession();
    expect(discounts).toBeUndefined();
    expect(allow_promotion_codes).toBe(true);
  });

  it('opens no checkout and logs when Stripe has no Growth price', async () => {
    listPricesMock.mockResolvedValueOnce({ data: [] });

    const clientSecret = await createGrowthCheckoutSession(
      MOCK_STRIPE,
      request(),
    );

    expect(clientSecret).toBeUndefined();
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.CHECKOUT_PRICE_MISSING,
      { tenantId: MOCK_TENANT_ID, interval: BILLING_INTERVAL.MONTHLY },
    );
  });
});
