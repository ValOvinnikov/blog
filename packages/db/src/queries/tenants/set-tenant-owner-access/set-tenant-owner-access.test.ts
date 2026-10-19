import { ERROR_CODE } from '@blog/config/constants';
import { getTenantOwnerAccess } from '@blog/db/queries/tenants/get-tenant-owner-access';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { setTenantOwnerAccess } from './set-tenant-owner-access';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantOwnerAccess, () => {
  it('writes owner access that reads back unchanged', async () => {
    const { id } = await insertTestTenant(db());

    await setTenantOwnerAccess(id, {
      sanityInviteId: 'invite-1',
      inviteSentAt: new Date('2026-10-01T09:00:00.000Z'),
      sanityRole: 'VIEWER',
    });

    expect(await getTenantOwnerAccess(id)).toEqual({
      sanityInviteId: 'invite-1',
      inviteSentAt: new Date('2026-10-01T09:00:00.000Z'),
      inviteAcceptedAt: undefined,
      sanityUserId: undefined,
      loginProvider: undefined,
      sanityRole: 'VIEWER',
    });
  });

  it('keeps fields the input leaves out', async () => {
    const { id } = await insertTestTenant(db(), {
      ownerSanityInviteId: 'invite-1',
      ownerSanityRole: 'VIEWER',
    });

    const result = await setTenantOwnerAccess(id, {
      inviteAcceptedAt: new Date('2026-10-01T09:30:00.000Z'),
      sanityUserId: 'user-1',
      loginProvider: 'GOOGLE',
      sanityRole: 'ADMINISTRATOR',
    });

    expect(result).toEqual({
      ok: true,
      data: {
        sanityInviteId: 'invite-1',
        inviteSentAt: undefined,
        inviteAcceptedAt: new Date('2026-10-01T09:30:00.000Z'),
        sanityUserId: 'user-1',
        loginProvider: 'GOOGLE',
        sanityRole: 'ADMINISTRATOR',
      },
    });
  });

  it('clears a field set to null', async () => {
    const { id } = await insertTestTenant(db(), {
      ownerSanityInviteId: 'invite-1',
      ownerInviteAcceptedAt: new Date('2026-10-01T09:30:00.000Z'),
    });

    await setTenantOwnerAccess(id, {
      sanityInviteId: 'invite-2',
      inviteAcceptedAt: null,
    });

    expect(await getTenantOwnerAccess(id)).toMatchObject({
      sanityInviteId: 'invite-2',
      inviteAcceptedAt: undefined,
    });
  });

  it('leaves every owner access field untouched given an empty input', async () => {
    const { id } = await insertTestTenant(db(), {
      ownerSanityInviteId: 'invite-1',
    });

    const result = await setTenantOwnerAccess(id, {});

    expect(result).toMatchObject({
      ok: true,
      data: { sanityInviteId: 'invite-1' },
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await setTenantOwnerAccess(
      '00000000-0000-0000-0000-000000000000',
      { sanityUserId: 'user-1' },
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
