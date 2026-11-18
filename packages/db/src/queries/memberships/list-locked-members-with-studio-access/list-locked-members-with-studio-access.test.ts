import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { insertTestMember } from '@shinefold/db/testing/memberships/fixtures';
import {
  mockMemberStudioAccess,
  toMemberStudioAccessColumns,
} from '@shinefold/db/testing/memberships/studio-access';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { listLockedMembersWithStudioAccess } from './list-locked-members-with-studio-access';

vi.mock('@shinefold/db/client');

faker.seed(76071);

const db = useQueryTestDb();

const MOCK_EDITOR_EMAIL = faker.internet.email().toLowerCase();

const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(listLockedMembersWithStudioAccess, () => {
  it.each([
    ['accepted Studio access', mockMemberStudioAccess()],
    [
      'a Studio invite not yet accepted',
      mockMemberStudioAccess({
        inviteAcceptedAt: undefined,
        sanityUserId: undefined,
        loginProvider: undefined,
      }),
    ],
  ])('lists a locked member with %s', async (_description, access) => {
    const { id } = await insertTestMember(
      db(),
      tenant().id,
      MOCK_EDITOR_EMAIL,
      { lockedAt: MOCK_NOW, ...toMemberStudioAccessColumns(access) },
    );

    await expect(listLockedMembersWithStudioAccess()).resolves.toEqual([
      {
        tenantId: tenant().id,
        membershipId: id,
        email: MOCK_EDITOR_EMAIL,
        sanityUserId: access.sanityUserId,
      },
    ]);
  });

  it.each([
    [
      'an unlocked member with Studio access',
      toMemberStudioAccessColumns(mockMemberStudioAccess()),
    ],
    ['a locked member with no Studio access', { lockedAt: MOCK_NOW }],
  ])('excludes %s', async (_description, overrides) => {
    await insertTestMember(db(), tenant().id, MOCK_EDITOR_EMAIL, overrides);

    await expect(listLockedMembersWithStudioAccess()).resolves.toEqual([]);
  });
});
