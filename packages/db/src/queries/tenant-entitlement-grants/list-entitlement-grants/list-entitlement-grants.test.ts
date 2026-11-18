import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import {
  insertTestAdmin,
  insertTestTenant,
  MOCK_OPERATOR_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestEntitlementGrant,
  MOCK_GRANT_FUTURE,
  MOCK_GRANT_PAST,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { listEntitlementGrants } from './list-entitlement-grants';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.tenantEntitlementGrants);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(listEntitlementGrants, () => {
  it('lists open grants with the granting admin email', async () => {
    const { id: grantedBy } = await insertTestAdmin(
      db(),
      userPersonalColumns({ email: MOCK_OPERATOR_EMAIL }),
    );
    const { id } = await insertTestEntitlementGrant(db(), tenant().id, {
      grantedBy,
      expiresAt: MOCK_GRANT_FUTURE,
    });

    expect(await listEntitlementGrants(tenant().id)).toEqual([
      expect.objectContaining({ id, grantedByEmail: MOCK_OPERATOR_EMAIL }),
    ]);
  });

  it('lists an expired grant that is not revoked', async () => {
    const { id } = await insertTestEntitlementGrant(db(), tenant().id, {
      expiresAt: MOCK_GRANT_PAST,
    });

    expect(await listEntitlementGrants(tenant().id)).toEqual([
      expect.objectContaining({ id, expiresAt: MOCK_GRANT_PAST }),
    ]);
  });

  it('leaves out a revoked grant', async () => {
    await insertTestEntitlementGrant(db(), tenant().id, {
      revokedAt: MOCK_GRANT_PAST,
    });

    expect(await listEntitlementGrants(tenant().id)).toEqual([]);
  });

  it("leaves out another tenant's grants", async () => {
    const other = await insertTestTenant(db());
    await insertTestEntitlementGrant(db(), other.id);

    expect(await listEntitlementGrants(tenant().id)).toEqual([]);
  });
});
