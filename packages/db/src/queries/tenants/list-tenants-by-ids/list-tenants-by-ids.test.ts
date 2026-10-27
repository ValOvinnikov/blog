import { getDb } from '@blog/db/client';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';

import { listTenantsByIds } from './list-tenants-by-ids';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsByIds, () => {
  describe('with a tenant stored', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db());
    });

    it('silently omits ids with no matching row', async () => {
      const result = await listTenantsByIds([
        tenant.id,
        MOCK_MISSING_TENANT_ID,
      ]);

      expect(result).toEqual([tenant]);
    });

    it('resolves multiple ids to their tenants', async () => {
      const otherTenant = await insertTestTenant(db());

      const result = await listTenantsByIds([tenant.id, otherTenant.id]);

      expect(new Set(result)).toEqual(new Set([tenant, otherTenant]));
    });
  });

  it('returns an empty array without querying when given no ids', async () => {
    const result = await listTenantsByIds([]);

    expect(result).toEqual([]);
    expect(getDb).not.toHaveBeenCalled();
  });
});
