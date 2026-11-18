import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestEntitlementGrant,
  MOCK_GRANT_PAST,
  useEntitlementGrantAdmin,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { revokeEntitlementGrant } from './revoke-entitlement-grant';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

const admin = useEntitlementGrantAdmin(db);

describe(revokeEntitlementGrant, () => {
  it('closes the open grant and keeps it as history', async () => {
    const { id } = await insertTestEntitlementGrant(db(), tenant().id);

    expect(
      await revokeEntitlementGrant(tenant().id, id, admin()),
    ).toMatchObject({ id, revokedAt: MOCK_NOW, revokedBy: admin() });
  });

  it('leaves an already revoked grant as it was', async () => {
    const { id } = await insertTestEntitlementGrant(db(), tenant().id, {
      revokedAt: MOCK_GRANT_PAST,
    });

    expect(
      await revokeEntitlementGrant(tenant().id, id, admin()),
    ).toBeUndefined();
  });

  it("never revokes another tenant's grant", async () => {
    const other = await insertTestTenant(db());
    const { id } = await insertTestEntitlementGrant(db(), other.id);

    expect(
      await revokeEntitlementGrant(tenant().id, id, admin()),
    ).toBeUndefined();
  });
});
