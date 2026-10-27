import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_ID,
  mockTenantOwnerAccess,
  toTenantOwnerAccessColumns,
} from '@blog/db/testing/tenants/fixtures';

import { getTenantOwnerAccess } from './get-tenant-owner-access';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantOwnerAccess, () => {
  it('reads every field as undefined for a tenant with no owner access recorded', async () => {
    const { id } = await insertTestTenant(db());

    const result = await getTenantOwnerAccess(id);

    expect(result).toEqual({
      sanityInviteId: undefined,
      inviteSentAt: undefined,
      inviteAcceptedAt: undefined,
      sanityUserId: undefined,
      loginProvider: undefined,
      sanityRole: undefined,
      inviteHeadsUpSentAt: undefined,
      inviteNudgeSentAt: undefined,
      siteReadySentAt: undefined,
    });
  });

  it('reads the stored owner access', async () => {
    const ownerAccess = mockTenantOwnerAccess();
    const { id } = await insertTestTenant(
      db(),
      toTenantOwnerAccessColumns(ownerAccess),
    );

    const result = await getTenantOwnerAccess(id);

    expect(result).toEqual(ownerAccess);
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    const result = await getTenantOwnerAccess(MOCK_MISSING_TENANT_ID);

    expect(result).toBeUndefined();
  });
});
