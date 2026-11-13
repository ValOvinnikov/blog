import { BILLING_CURRENCY, STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { listStripePrices } from '@blog/db/queries/stripe-catalogue/list-stripe-prices';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_DOLLAR_AMOUNT,
  MOCK_EURO_AMOUNT,
  MOCK_OTHER_STRIPE_PRICE_ID,
  MOCK_STRIPE_PRODUCT_ID,
  mockSaveStripePriceInput,
} from '@blog/db/testing/stripe-catalogue/fixtures';

import { saveStripePrice } from './save-stripe-price';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.stripePrices);
});

describe(saveStripePrice, () => {
  beforeEach(async () => {
    await saveStripePrice(mockSaveStripePriceInput());
  });

  it('stores one amount per currency for the lookup key', async () => {
    expect(await listStripePrices()).toEqual([
      {
        lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
        currency: BILLING_CURRENCY.EUR,
        unitAmount: MOCK_EURO_AMOUNT,
        stripeProductId: MOCK_STRIPE_PRODUCT_ID,
      },
      {
        lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
        currency: BILLING_CURRENCY.USD,
        unitAmount: MOCK_DOLLAR_AMOUNT,
        stripeProductId: MOCK_STRIPE_PRODUCT_ID,
      },
    ]);
  });

  it('replaces the amounts on a new Price and drops currencies it lacks', async () => {
    await saveStripePrice(
      mockSaveStripePriceInput({
        stripePriceId: MOCK_OTHER_STRIPE_PRICE_ID,
        amounts: [
          { currency: BILLING_CURRENCY.USD, unitAmount: MOCK_EURO_AMOUNT },
        ],
      }),
    );

    expect(await listStripePrices()).toEqual([
      expect.objectContaining({
        currency: BILLING_CURRENCY.USD,
        unitAmount: MOCK_EURO_AMOUNT,
      }),
    ]);
  });

  it('removes every amount of a lookup key saved with none', async () => {
    await saveStripePrice(mockSaveStripePriceInput({ amounts: [] }));

    expect(await listStripePrices()).toEqual([]);
  });

  it('leaves other lookup keys alone', async () => {
    await saveStripePrice(
      mockSaveStripePriceInput({
        lookupKey: STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
        stripePriceId: MOCK_OTHER_STRIPE_PRICE_ID,
        amounts: [],
      }),
    );

    expect(await listStripePrices()).toHaveLength(2);
  });
});
