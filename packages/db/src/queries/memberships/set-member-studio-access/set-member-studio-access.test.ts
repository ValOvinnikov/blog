import { faker } from '@faker-js/faker';
import { ERROR_CODE, SANITY_LOGIN_PROVIDER } from '@shinefold/config/constants';
import { getMemberStudioAccess } from '@shinefold/db/queries/memberships/get-member-studio-access';
import type { TMemberStudioAccess } from '@shinefold/db/queries/memberships/member-studio-access';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { insertTestMember } from '@shinefold/db/testing/memberships/fixtures';
import {
  mockMemberStudioAccess,
  toMemberStudioAccessColumns,
} from '@shinefold/db/testing/memberships/studio-access';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { setMemberStudioAccess } from './set-member-studio-access';

vi.mock('@shinefold/db/client');

faker.seed(71681);

const db = useQueryTestDb();

const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(setMemberStudioAccess, () => {
  it('writes Studio access that reads back unchanged', async () => {
    const { id } = await insertTestMember(
      db(),
      tenant().id,
      faker.internet.email(),
    );
    const access = mockMemberStudioAccess();

    await setMemberStudioAccess(tenant().id, id, access);

    const stored = await getMemberStudioAccess(tenant().id, id);
    expect(stored?.access).toEqual(access);
  });

  it('keeps fields the input leaves out', async () => {
    const { sanityInviteId, inviteSentAt } = mockMemberStudioAccess();
    const { id } = await insertTestMember(
      db(),
      tenant().id,
      faker.internet.email(),
      toMemberStudioAccessColumns({ sanityInviteId, inviteSentAt }),
    );
    const { inviteAcceptedAt, sanityUserId } = mockMemberStudioAccess();

    const result = await setMemberStudioAccess(tenant().id, id, {
      inviteAcceptedAt,
      sanityUserId,
      loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        sanityInviteId,
        inviteSentAt,
        inviteAcceptedAt,
        sanityUserId,
        loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
      },
    });
  });

  describe('a member with Studio access stored', () => {
    let access: TMemberStudioAccess;
    let id: string;

    beforeEach(async () => {
      access = mockMemberStudioAccess();
      ({ id } = await insertTestMember(
        db(),
        tenant().id,
        faker.internet.email(),
        toMemberStudioAccessColumns(access),
      ));
    });

    it('clears a field set to null', async () => {
      const result = await setMemberStudioAccess(tenant().id, id, {
        sanityInviteId: null,
      });

      expect(result).toEqual({
        ok: true,
        data: { ...access, sanityInviteId: undefined },
      });
    });

    it('returns the stored access unchanged for an empty input', async () => {
      await expect(setMemberStudioAccess(tenant().id, id, {})).resolves.toEqual(
        {
          ok: true,
          data: access,
        },
      );
    });

    it('refuses the member through another tenant and leaves it unchanged', async () => {
      const { id: otherTenantId } = await insertTestTenant(db());

      const result = await setMemberStudioAccess(otherTenantId, id, {
        sanityInviteId: null,
      });

      expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
      const stored = await getMemberStudioAccess(tenant().id, id);
      expect(stored?.access).toEqual(access);
    });
  });

  it('records against a locked member', async () => {
    const { id } = await insertTestMember(
      db(),
      tenant().id,
      faker.internet.email(),
      { lockedAt: MOCK_NOW },
    );
    const access = mockMemberStudioAccess();

    await expect(
      setMemberStudioAccess(tenant().id, id, access),
    ).resolves.toEqual({ ok: true, data: access });
  });

  it('reports DB_NOT_FOUND for an id that is not a UUID', async () => {
    await expect(
      setMemberStudioAccess(tenant().id, faker.lorem.word(), {}),
    ).resolves.toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
