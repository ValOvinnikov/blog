import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { listStripePrices } from '@blog/db/queries/stripe-catalogue/list-stripe-prices';
import { saveStripePrice } from '@blog/db/queries/stripe-catalogue/save-stripe-price';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_OTHER_STRIPE_PRICE_ID,
  MOCK_STRIPE_PRICE_ID,
  mockSaveStripePriceInput,
} from '@blog/db/testing/stripe-catalogue/fixtures';

import { removeStripePricesExcept } from './remove-stripe-prices-except';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.stripePrices);
});

describe(removeStripePricesExcept, () => {
  beforeEach(async () => {
    await saveStripePrice(mockSaveStripePriceInput());
    await saveStripePrice(
      mockSaveStripePriceInput({
        lookupKey: STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
        stripePriceId: MOCK_OTHER_STRIPE_PRICE_ID,
      }),
    );
  });

  it('keeps the rows of the given Prices and removes the rest', async () => {
    await removeStripePricesExcept([MOCK_OTHER_STRIPE_PRICE_ID]);

    const remaining = await listStripePrices();
    expect(remaining.map(({ lookupKey }) => lookupKey)).toEqual([
      STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
      STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
    ]);
  });

  it('removes every row when no Price is kept', async () => {
    await removeStripePricesExcept([]);

    expect(await listStripePrices()).toEqual([]);
  });

  it('removes nothing when every Price is kept', async () => {
    const before = await listStripePrices();

    await removeStripePricesExcept([
      MOCK_STRIPE_PRICE_ID,
      MOCK_OTHER_STRIPE_PRICE_ID,
    ]);

    expect(await listStripePrices()).toEqual(before);
  });
});
