import { getDb } from '@shinefold/db/client';
import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';

import { listTenantsByIds } from './list-tenants-by-ids';

vi.mock('@shinefold/db/client');

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
