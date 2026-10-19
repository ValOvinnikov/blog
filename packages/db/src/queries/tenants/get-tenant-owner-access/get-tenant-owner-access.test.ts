import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getTenantOwnerAccess } from './get-tenant-owner-access';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

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
    const { id } = await insertTestTenant(db(), {
      ownerSanityInviteId: 'invite-1',
      ownerInviteSentAt: new Date('2026-10-01T09:00:00.000Z'),
      ownerInviteAcceptedAt: new Date('2026-10-01T09:30:00.000Z'),
      ownerSanityUserId: 'user-1',
      ownerLoginProvider: 'GITHUB',
      ownerSanityRole: 'ADMINISTRATOR',
    });

    expect(await getTenantOwnerAccess(id)).toEqual({
      sanityInviteId: 'invite-1',
      inviteSentAt: new Date('2026-10-01T09:00:00.000Z'),
      inviteAcceptedAt: new Date('2026-10-01T09:30:00.000Z'),
      sanityUserId: 'user-1',
      loginProvider: 'GITHUB',
      sanityRole: 'ADMINISTRATOR',
    });
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    expect(
      await getTenantOwnerAccess('00000000-0000-0000-0000-000000000000'),
    ).toBeUndefined();
  });
});
