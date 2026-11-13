import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { saveOrRemoveCataloguePrice } from '@platform/server/billing/catalogue/sync-catalogue-price';
import { saveOrRemoveCataloguePromotionCode } from '@platform/server/billing/catalogue/sync-catalogue-promotion-code';
import {
  mockStripeCataloguePrice,
  mockStripeCataloguePromotionCode,
} from '@platform/testing/billing/catalogue';
import type Stripe from 'stripe';

import {
  LOOKUP_KEYS_PER_LIST,
  syncStripeCatalogue,
} from './sync-stripe-catalogue';

vi.mock('@platform/server/billing/catalogue/sync-catalogue-price', () => ({
  saveOrRemoveCataloguePrice: vi.fn(),
}));
vi.mock(
  '@platform/server/billing/catalogue/sync-catalogue-promotion-code',
  () => ({ saveOrRemoveCataloguePromotionCode: vi.fn() }),
);
vi.mock('@platform/server/billing/stripe-client');

const MOCK_PRICE = mockStripeCataloguePrice();
const MOCK_PROMOTION_CODE = mockStripeCataloguePromotionCode();

describe(syncStripeCatalogue, () => {
  let stripe: Stripe;

  beforeEach(() => {
    stripe = {
      prices: { list: vi.fn(() => [MOCK_PRICE]) },
      promotionCodes: { list: vi.fn(() => [MOCK_PROMOTION_CODE]) },
    } as unknown as Stripe;
  });

  it('asks for every plan lookup key, within Stripe’s per-call limit', async () => {
    await syncStripeCatalogue(stripe);

    const requestedKeys = vi
      .mocked(stripe.prices.list)
      .mock.calls.flatMap(([params]) => params?.lookup_keys ?? []);
    expect(requestedKeys.toSorted()).toEqual(
      Object.values(STRIPE_PRICE_LOOKUP_KEY).toSorted(),
    );
    expect(
      vi
        .mocked(stripe.prices.list)
        .mock.calls.every(
          ([params]) =>
            (params?.lookup_keys?.length ?? 0) <= LOOKUP_KEYS_PER_LIST,
        ),
    ).toBe(true);
  });

  it('saves or removes each Price and promotion code it finds', async () => {
    const summary = await syncStripeCatalogue(stripe);

    const listCalls = vi.mocked(stripe.prices.list).mock.calls.length;
    expect(summary).toEqual({ prices: listCalls, promotionCodes: 1 });
    expect(saveOrRemoveCataloguePrice).toHaveBeenCalledWith(MOCK_PRICE);
    expect(saveOrRemoveCataloguePromotionCode).toHaveBeenCalledWith(
      MOCK_PROMOTION_CODE,
    );
  });
});
