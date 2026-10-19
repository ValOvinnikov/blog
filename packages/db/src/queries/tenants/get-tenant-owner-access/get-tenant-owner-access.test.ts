import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  makeTenantOwnerAccess,
  toTenantOwnerAccessColumns,
} from '@blog/db/testing/tenants/fixtures';

import { getTenantOwnerAccess } from './get-tenant-owner-access';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const MISSING_TENANT_ID = '00000000-0000-0000-0000-000000000000';

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantOwnerAccess, () => {
  it('reads every field as undefined for a tenant with no owner access recorded', async () => {
    const { id } = await insertTestTenant(db());

    expect(await getTenantOwnerAccess(id)).toEqual({
      sanityInviteId: undefined,
      inviteSentAt: undefined,
      inviteAcceptedAt: undefined,
      sanityUserId: undefined,
      loginProvider: undefined,
      sanityRole: undefined,
    });
  });

  it('reads the stored owner access', async () => {
    const ownerAccess = makeTenantOwnerAccess();
    const { id } = await insertTestTenant(
      db(),
      toTenantOwnerAccessColumns(ownerAccess),
    );

    expect(await getTenantOwnerAccess(id)).toEqual(ownerAccess);
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    expect(await getTenantOwnerAccess(MISSING_TENANT_ID)).toBeUndefined();
  });
});
