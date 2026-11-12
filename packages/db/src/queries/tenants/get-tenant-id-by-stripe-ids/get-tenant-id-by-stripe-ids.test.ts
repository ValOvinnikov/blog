import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { mockStripeIds } from '@blog/db/testing/tenants/billing';

import {
  getTenantIdByStripeIds,
  type TStripeIds,
} from './get-tenant-id-by-stripe-ids';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

let ids: TStripeIds;

beforeEach(() => {
  ids = mockStripeIds();
});

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantIdByStripeIds, () => {
  describe('a tenant carrying the customer id', () => {
    let customerTenantId: string;

    beforeEach(async () => {
      ({ id: customerTenantId } = await insertTestTenant(db(), {
        stripeCustomerId: ids.stripeCustomerId,
      }));
    });

    it('is found when its subscription id is not stored yet', async () => {
      const result = await getTenantIdByStripeIds(ids);

      expect(result).toBe(customerTenantId);
    });

    it('wins over another tenant carrying the subscription id', async () => {
      await insertTestTenant(db(), {
        stripeSubscriptionId: ids.stripeSubscriptionId,
      });

      const result = await getTenantIdByStripeIds(ids);

      expect(result).toBe(customerTenantId);
    });
  });

  it('finds the tenant by its subscription id when the customer id differs', async () => {
    const { id } = await insertTestTenant(db(), {
      stripeSubscriptionId: ids.stripeSubscriptionId,
    });

    const result = await getTenantIdByStripeIds(ids);

    expect(result).toBe(id);
  });

  it('returns undefined when no tenant carries either id', async () => {
    await insertTestTenant(db(), mockStripeIds());

    const result = await getTenantIdByStripeIds(ids);

    expect(result).toBeUndefined();
  });
});
