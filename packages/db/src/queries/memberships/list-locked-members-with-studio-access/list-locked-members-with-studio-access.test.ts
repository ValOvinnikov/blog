import { faker } from '@faker-js/faker';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_EDITOR_EMAIL,
  insertTestMember,
} from '@shinefold/db/testing/memberships/fixtures';
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

const READY_TENANT = {
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
};

const LOCKED_WITH_ACCESS = {
  lockedAt: MOCK_NOW,
  ...toMemberStudioAccessColumns(mockMemberStudioAccess()),
};

const tenant = useTestTenant(db, READY_TENANT);

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

  it.each([
    ['an ARCHIVED site', { ...READY_TENANT, status: TENANT_STATUS.ARCHIVED }],
    [
      'a site still provisioning',
      { provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING },
    ],
  ])(
    'excludes a locked member with Studio access on %s',
    async (_description, tenantOverrides) => {
      const { id } = await insertTestTenant(db(), tenantOverrides);
      await insertTestMember(db(), id, MOCK_EDITOR_EMAIL, LOCKED_WITH_ACCESS);

      await expect(listLockedMembersWithStudioAccess()).resolves.toEqual([]);
    },
  );
});
