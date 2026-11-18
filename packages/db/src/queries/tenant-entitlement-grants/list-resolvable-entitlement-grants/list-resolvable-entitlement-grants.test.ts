import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertClosedTestEntitlementGrants,
  insertTestEntitlementGrant,
  MOCK_GRANT_FUTURE,
  useEntitlementGrantAdmin,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { listResolvableEntitlementGrants } from './list-resolvable-entitlement-grants';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

const admin = useEntitlementGrantAdmin(db);

describe(listResolvableEntitlementGrants, () => {
  it('lists only the fields the resolver reads for each open grant', async () => {
    const { kind, key, value } = await insertTestEntitlementGrant(
      db(),
      tenant().id,
      { grantedBy: admin(), expiresAt: MOCK_GRANT_FUTURE },
    );

    expect(await listResolvableEntitlementGrants(tenant().id)).toEqual([
      {
        kind,
        key,
        value,
        expiresAt: MOCK_GRANT_FUTURE,
        revokedAt: null,
      },
    ]);
  });

  it('leaves out revoked and expired grants', async () => {
    await insertClosedTestEntitlementGrants(db(), tenant().id);

    expect(await listResolvableEntitlementGrants(tenant().id)).toEqual([]);
  });

  it("leaves out another tenant's grants", async () => {
    const other = await insertTestTenant(db());
    await insertTestEntitlementGrant(db(), other.id);

    expect(await listResolvableEntitlementGrants(tenant().id)).toEqual([]);
  });
});
