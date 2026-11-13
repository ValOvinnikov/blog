import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import {
  MOCK_STRIPE_COUPON_ID,
  mockStripeCataloguePrice,
  mockStripeCataloguePromotionCode,
  mockStripeCoupon,
} from '@platform/testing/billing/catalogue';
import {
  MOCK_STRIPE_CLIENT,
  MOCK_STRIPE_PRICE_ID,
  MOCK_STRIPE_PROMOTION_CODE_ID,
  MOCK_UNHANDLED_EVENT_TYPE,
} from '@platform/testing/billing/fixtures';
import { mockStripeEvent } from '@platform/testing/billing/stripe-subscription';

import { handleCatalogueEvent } from './handle-catalogue-event';
import { syncCataloguePrice } from './sync-catalogue-price';
import {
  syncCataloguePromotionCode,
  syncCouponPromotionCodes,
} from './sync-catalogue-promotion-code';

const { removeStripePriceMock } = vi.hoisted(() => ({
  removeStripePriceMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { stripeCatalogue: { removeStripePrice: removeStripePriceMock } },
}));
vi.mock('./sync-catalogue-price');
vi.mock('./sync-catalogue-promotion-code');

describe(handleCatalogueEvent, () => {
  it.each([STRIPE_EVENT_TYPE.PRICE_CREATED, STRIPE_EVENT_TYPE.PRICE_UPDATED])(
    're-reads the Price on %s',
    async (type) => {
      const handled = await handleCatalogueEvent(
        MOCK_STRIPE_CLIENT,
        mockStripeEvent(type, mockStripeCataloguePrice()),
      );

      expect(handled).toBe(true);
      expect(syncCataloguePrice).toHaveBeenCalledWith(
        MOCK_STRIPE_CLIENT,
        MOCK_STRIPE_PRICE_ID,
      );
    },
  );

  it('removes a deleted Price without re-reading it', async () => {
    await handleCatalogueEvent(
      MOCK_STRIPE_CLIENT,
      mockStripeEvent(
        STRIPE_EVENT_TYPE.PRICE_DELETED,
        mockStripeCataloguePrice(),
      ),
    );

    expect(removeStripePriceMock).toHaveBeenCalledWith(MOCK_STRIPE_PRICE_ID);
    expect(syncCataloguePrice).not.toHaveBeenCalled();
  });

  it.each([
    STRIPE_EVENT_TYPE.PROMOTION_CODE_CREATED,
    STRIPE_EVENT_TYPE.PROMOTION_CODE_UPDATED,
  ])('re-reads the promotion code on %s', async (type) => {
    await handleCatalogueEvent(
      MOCK_STRIPE_CLIENT,
      mockStripeEvent(type, mockStripeCataloguePromotionCode()),
    );

    expect(syncCataloguePromotionCode).toHaveBeenCalledWith(
      MOCK_STRIPE_CLIENT,
      MOCK_STRIPE_PROMOTION_CODE_ID,
    );
  });

  it("re-reads a deleted coupon's promotion codes", async () => {
    await handleCatalogueEvent(
      MOCK_STRIPE_CLIENT,
      mockStripeEvent(STRIPE_EVENT_TYPE.COUPON_DELETED, mockStripeCoupon()),
    );

    expect(syncCouponPromotionCodes).toHaveBeenCalledWith(
      MOCK_STRIPE_CLIENT,
      MOCK_STRIPE_COUPON_ID,
    );
  });

  it('leaves any other event to the subscription path', async () => {
    expect(
      await handleCatalogueEvent(
        MOCK_STRIPE_CLIENT,
        mockStripeEvent(MOCK_UNHANDLED_EVENT_TYPE),
      ),
    ).toBe(false);
  });
});
