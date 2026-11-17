import { faker } from '@faker-js/faker';
import {
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@shinefold/db/constants';
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

import { listMembersPendingStudioAccess } from './list-members-pending-studio-access';

vi.mock('@shinefold/db/client');

faker.seed(71682);

const db = useQueryTestDb();

const READY_TENANT = {
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
};

const tenant = useTestTenant(db, READY_TENANT);

afterEach(async () => {
  await db().delete(schema.users);
});

function insertEditor(
  overrides: Parameters<typeof insertTestMember>[3] = {},
  onTenantId: string = tenant().id,
) {
  return insertTestMember(db(), onTenantId, faker.internet.email(), {
    role: MEMBERSHIP_ROLE.EDITOR,
    ...overrides,
  });
}

describe(listMembersPendingStudioAccess, () => {
  it.each([
    ['not invited to the Studio yet', {}],
    [
      'invited and not yet accepted',
      mockMemberStudioAccess({
        inviteAcceptedAt: undefined,
        sanityUserId: undefined,
      }),
    ],
    [
      'accepted and not yet raised to administrator',
      mockMemberStudioAccess({ sanityUserId: undefined }),
    ],
  ])('includes an editor %s', async (_description, access) => {
    const { id } = await insertEditor(toMemberStudioAccessColumns(access));

    await expect(listMembersPendingStudioAccess()).resolves.toEqual([
      { tenantId: tenant().id, membershipId: id },
    ]);
  });

  it.each([
    [
      'an editor whose Studio access is ready',
      () => insertEditor(toMemberStudioAccessColumns(mockMemberStudioAccess())),
    ],
    ['a locked editor', () => insertEditor({ lockedAt: MOCK_NOW })],
    [
      'an owner, whose access the owner flow handles',
      () => insertEditor({ role: MEMBERSHIP_ROLE.OWNER }),
    ],
    ['a reader', () => insertEditor({ role: MEMBERSHIP_ROLE.READER })],
    [
      'an editor of a tenant still provisioning',
      async () => {
        const { id } = await insertTestTenant(db(), {
          provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        });
        return insertEditor({}, id);
      },
    ],
    [
      'an editor of a SUSPENDED tenant',
      async () => {
        const { id } = await insertTestTenant(db(), {
          ...READY_TENANT,
          status: TENANT_STATUS.SUSPENDED,
        });
        return insertEditor({}, id);
      },
    ],
  ])('excludes %s', async (_description, insert) => {
    await insert();

    await expect(listMembersPendingStudioAccess()).resolves.toEqual([]);
  });
});
