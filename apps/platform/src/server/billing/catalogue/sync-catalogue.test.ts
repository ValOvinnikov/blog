import {
  MOCK_STRIPE_COUPON_ID,
  mockStripeCataloguePrice,
  mockStripeCataloguePromotionCode,
} from '@platform/testing/billing/catalogue';
import {
  MOCK_STRIPE_PRICE_ID,
  MOCK_STRIPE_PROMOTION_CODE_ID,
} from '@platform/testing/billing/fixtures';
import { stripeCall } from '@platform/testing/billing/stripe-call';
import type Stripe from 'stripe';

import { syncCataloguePrice } from './sync-catalogue-price';
import {
  syncCataloguePromotionCode,
  syncCouponPromotionCodes,
} from './sync-catalogue-promotion-code';

const { catalogueMocks } = vi.hoisted(() => ({
  catalogueMocks: {
    saveStripePrice: vi.fn(),
    removeStripePrice: vi.fn(),
    saveStripePromotionCode: vi.fn(),
    removeStripePromotionCode: vi.fn(),
  },
}));

vi.mock('@blog/db', () => ({ queries: { stripeCatalogue: catalogueMocks } }));

describe('catalogue sync', () => {
  let stripe: Stripe;

  beforeEach(() => {
    stripe = {
      prices: { retrieve: stripeCall(mockStripeCataloguePrice()) },
      promotionCodes: {
        retrieve: stripeCall(mockStripeCataloguePromotionCode()),
        list: vi.fn(() => [
          mockStripeCataloguePromotionCode({ active: false }),
        ]),
      },
    } as unknown as Stripe;
  });

  it('saves a plan Price it re-reads with its currency options', async () => {
    await syncCataloguePrice(stripe, MOCK_STRIPE_PRICE_ID);

    expect(stripe.prices.retrieve).toHaveBeenCalledWith(MOCK_STRIPE_PRICE_ID, {
      expand: ['currency_options'],
    });
    expect(catalogueMocks.saveStripePrice).toHaveBeenCalledOnce();
  });

  it('removes a Price that is no longer a plan Price', async () => {
    vi.mocked(stripe.prices.retrieve).mockResolvedValue(
      mockStripeCataloguePrice({ lookup_key: null }) as never,
    );

    await syncCataloguePrice(stripe, MOCK_STRIPE_PRICE_ID);

    expect(catalogueMocks.removeStripePrice).toHaveBeenCalledWith(
      MOCK_STRIPE_PRICE_ID,
    );
  });

  it("saves a public code re-read with its coupon's products and currencies", async () => {
    await syncCataloguePromotionCode(stripe, MOCK_STRIPE_PROMOTION_CODE_ID);

    expect(stripe.promotionCodes.retrieve).toHaveBeenCalledWith(
      MOCK_STRIPE_PROMOTION_CODE_ID,
      {
        expand: [
          'promotion.coupon.applies_to',
          'promotion.coupon.currency_options',
        ],
      },
    );
    expect(catalogueMocks.saveStripePromotionCode).toHaveBeenCalledOnce();
  });

  it("removes a deleted coupon's codes that no longer apply", async () => {
    await syncCouponPromotionCodes(stripe, MOCK_STRIPE_COUPON_ID);

    expect(stripe.promotionCodes.list).toHaveBeenCalledWith({
      coupon: MOCK_STRIPE_COUPON_ID,
      expand: [
        'data.promotion.coupon.applies_to',
        'data.promotion.coupon.currency_options',
      ],
    });

    expect(catalogueMocks.removeStripePromotionCode).toHaveBeenCalledWith(
      MOCK_STRIPE_PROMOTION_CODE_ID,
    );
  });
});
