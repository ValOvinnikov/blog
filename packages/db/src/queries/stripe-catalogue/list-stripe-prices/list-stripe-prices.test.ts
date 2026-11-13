import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listStripePrices } from './list-stripe-prices';

vi.mock('@blog/db/client');

useQueryTestDb();

describe(listStripePrices, () => {
  it('returns nothing before any price is saved', async () => {
    expect(await listStripePrices()).toEqual([]);
  });
});
