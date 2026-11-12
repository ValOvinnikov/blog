import { getDb } from '@blog/db/client';
import { STRIPE_TENANT_LOOKUP_OUTCOME } from '@blog/db/constants';
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

let ids: Required<TStripeIds>;

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

      expect(result).toEqual({
        outcome: STRIPE_TENANT_LOOKUP_OUTCOME.FOUND,
        tenantId: customerTenantId,
      });
    });

    it('is found by the customer id alone', async () => {
      const result = await getTenantIdByStripeIds({
        stripeCustomerId: ids.stripeCustomerId,
      });

      expect(result).toEqual({
        outcome: STRIPE_TENANT_LOOKUP_OUTCOME.FOUND,
        tenantId: customerTenantId,
      });
    });

    it('conflicts with another tenant carrying the subscription id', async () => {
      const { id: subscriptionTenantId } = await insertTestTenant(db(), {
        stripeSubscriptionId: ids.stripeSubscriptionId,
      });

      const result = await getTenantIdByStripeIds(ids);

      expect(result).toEqual({
        outcome: STRIPE_TENANT_LOOKUP_OUTCOME.CONFLICT,
        customerTenantId,
        subscriptionTenantId,
      });
    });
  });

  it('finds the tenant by its subscription id when no tenant carries the customer id', async () => {
    const { id } = await insertTestTenant(db(), {
      stripeSubscriptionId: ids.stripeSubscriptionId,
    });

    const result = await getTenantIdByStripeIds(ids);

    expect(result).toEqual({
      outcome: STRIPE_TENANT_LOOKUP_OUTCOME.FOUND,
      tenantId: id,
    });
  });

  it('finds one tenant carrying both ids', async () => {
    const { id } = await insertTestTenant(db(), ids);

    const result = await getTenantIdByStripeIds(ids);

    expect(result).toEqual({
      outcome: STRIPE_TENANT_LOOKUP_OUTCOME.FOUND,
      tenantId: id,
    });
  });

  describe('with a stored tenant that matches neither id', () => {
    beforeEach(async () => {
      await insertTestTenant(db(), mockStripeIds());
    });

    it('is not found for ids no tenant carries', async () => {
      const result = await getTenantIdByStripeIds(ids);

      expect(result).toEqual({
        outcome: STRIPE_TENANT_LOOKUP_OUTCOME.NOT_FOUND,
      });
    });

    it('is not found without querying when no id is given', async () => {
      const result = await getTenantIdByStripeIds({});

      expect(result).toEqual({
        outcome: STRIPE_TENANT_LOOKUP_OUTCOME.NOT_FOUND,
      });
      expect(getDb).not.toHaveBeenCalled();
    });

    it('is not found without querying when both ids are empty strings', async () => {
      const result = await getTenantIdByStripeIds({
        stripeCustomerId: '',
        stripeSubscriptionId: '',
      });

      expect(result).toEqual({
        outcome: STRIPE_TENANT_LOOKUP_OUTCOME.NOT_FOUND,
      });
      expect(getDb).not.toHaveBeenCalled();
    });
  });
});
