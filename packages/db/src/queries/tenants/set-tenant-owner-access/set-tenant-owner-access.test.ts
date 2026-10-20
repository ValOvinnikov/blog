import { ERROR_CODE, SANITY_LOGIN_PROVIDER } from '@blog/config/constants';
import { SANITY_PROJECT_ROLE } from '@blog/db/constants';
import { getTenantOwnerAccess } from '@blog/db/queries/tenants/get-tenant-owner-access';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  makeTenantOwnerAccess,
  toTenantOwnerAccessColumns,
} from '@blog/db/testing/tenants/fixtures';

import { setTenantOwnerAccess } from './set-tenant-owner-access';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const MISSING_TENANT_ID = '00000000-0000-0000-0000-000000000000';

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantOwnerAccess, () => {
  it('writes owner access that reads back unchanged', async () => {
    const { id } = await insertTestTenant(db());
    const ownerAccess = makeTenantOwnerAccess();

    await setTenantOwnerAccess(id, ownerAccess);

    expect(await getTenantOwnerAccess(id)).toEqual(ownerAccess);
  });

  it('keeps fields the input leaves out', async () => {
    const { sanityInviteId, inviteSentAt } = makeTenantOwnerAccess();
    const { id } = await insertTestTenant(
      db(),
      toTenantOwnerAccessColumns({
        sanityInviteId,
        inviteSentAt,
        sanityRole: SANITY_PROJECT_ROLE.VIEWER,
      }),
    );
    const { inviteAcceptedAt, sanityUserId } = makeTenantOwnerAccess();

    const result = await setTenantOwnerAccess(id, {
      inviteAcceptedAt,
      sanityUserId,
      loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
      sanityRole: SANITY_PROJECT_ROLE.ADMINISTRATOR,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        sanityInviteId,
        inviteSentAt,
        inviteAcceptedAt,
        sanityUserId,
        loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
        sanityRole: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      },
    });
  });

  it('clears a field set to null', async () => {
    const { id } = await insertTestTenant(
      db(),
      toTenantOwnerAccessColumns(makeTenantOwnerAccess()),
    );
    const { sanityInviteId } = makeTenantOwnerAccess();

    await setTenantOwnerAccess(id, { sanityInviteId, inviteAcceptedAt: null });

    expect(await getTenantOwnerAccess(id)).toMatchObject({
      sanityInviteId,
      inviteAcceptedAt: undefined,
    });
  });

  it('leaves every owner access field untouched given an empty input', async () => {
    const ownerAccess = makeTenantOwnerAccess();
    const { id } = await insertTestTenant(
      db(),
      toTenantOwnerAccessColumns(ownerAccess),
    );

    expect(await setTenantOwnerAccess(id, {})).toEqual({
      ok: true,
      data: ownerAccess,
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const { sanityUserId } = makeTenantOwnerAccess();

    const result = await setTenantOwnerAccess(MISSING_TENANT_ID, {
      sanityUserId,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
