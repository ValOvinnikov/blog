import { ERROR_CODE, SANITY_LOGIN_PROVIDER } from '@blog/config/constants';
import { SANITY_PROJECT_ROLE } from '@blog/db/constants';
import { getTenantOwnerAccess } from '@blog/db/queries/tenants/get-tenant-owner-access';
import type { TTenantOwnerAccess } from '@blog/db/queries/tenants/tenant-owner-access';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_ID,
  mockTenantOwnerAccess,
  toTenantOwnerAccessColumns,
} from '@blog/db/testing/tenants/fixtures';

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
    const ownerAccess = mockTenantOwnerAccess();

    await setTenantOwnerAccess(id, ownerAccess);

    expect(await getTenantOwnerAccess(id)).toEqual(ownerAccess);
  });

  it('keeps fields the input leaves out', async () => {
    const { sanityInviteId, inviteSentAt } = mockTenantOwnerAccess();
    const { id } = await insertTestTenant(
      db(),
      toTenantOwnerAccessColumns({
        sanityInviteId,
        inviteSentAt,
        sanityRole: SANITY_PROJECT_ROLE.VIEWER,
      }),
    );
    const { inviteAcceptedAt, sanityUserId } = mockTenantOwnerAccess();

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

  describe('a tenant with owner access stored', () => {
    let ownerAccess: TTenantOwnerAccess;
    let id: string;

    beforeEach(async () => {
      ownerAccess = mockTenantOwnerAccess();
      ({ id } = await insertTestTenant(
        db(),
        toTenantOwnerAccessColumns(ownerAccess),
      ));
    });

    it('clears a field set to null', async () => {
      const { sanityInviteId } = mockTenantOwnerAccess();

      await setTenantOwnerAccess(id, {
        sanityInviteId,
        inviteAcceptedAt: null,
        siteReadySentAt: null,
      });

      expect(await getTenantOwnerAccess(id)).toEqual({
        ...ownerAccess,
        sanityInviteId,
        inviteAcceptedAt: undefined,
        siteReadySentAt: undefined,
      });
    });

    it('leaves every owner access field untouched given an empty input', async () => {
      expect(await setTenantOwnerAccess(id, {})).toEqual({
        ok: true,
        data: ownerAccess,
      });
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const { sanityUserId } = mockTenantOwnerAccess();

    const result = await setTenantOwnerAccess(MOCK_MISSING_TENANT_ID, {
      sanityUserId,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
