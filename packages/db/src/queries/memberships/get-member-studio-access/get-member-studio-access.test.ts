import { faker } from '@faker-js/faker';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
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

import { getMemberStudioAccess } from './get-member-studio-access';

vi.mock('@shinefold/db/client');

faker.seed(7168);

const db = useQueryTestDb();

const MOCK_EDITOR_EMAIL = faker.internet.email().toLowerCase();

const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getMemberStudioAccess, () => {
  it('returns the member’s role, decrypted email and recorded Studio access', async () => {
    const access = mockMemberStudioAccess();
    const { id } = await insertTestMember(
      db(),
      tenant().id,
      MOCK_EDITOR_EMAIL,
      {
        role: MEMBERSHIP_ROLE.EDITOR,
        ...toMemberStudioAccessColumns(access),
      },
    );

    await expect(getMemberStudioAccess(tenant().id, id)).resolves.toEqual({
      membershipId: id,
      role: MEMBERSHIP_ROLE.EDITOR,
      email: MOCK_EDITOR_EMAIL,
      access,
    });
  });

  it('reads a member with no Studio invite yet as all fields absent', async () => {
    const { id } = await insertTestMember(db(), tenant().id, MOCK_EDITOR_EMAIL);

    const target = await getMemberStudioAccess(tenant().id, id);

    expect(target?.access).toEqual({
      sanityInviteId: undefined,
      inviteSentAt: undefined,
      inviteAcceptedAt: undefined,
      sanityUserId: undefined,
      loginProvider: undefined,
    });
  });

  it('finds no member of another tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const { id } = await insertTestMember(
      db(),
      otherTenantId,
      MOCK_EDITOR_EMAIL,
    );

    await expect(
      getMemberStudioAccess(tenant().id, id),
    ).resolves.toBeUndefined();
  });

  it('finds no locked member', async () => {
    const { id } = await insertTestMember(
      db(),
      tenant().id,
      MOCK_EDITOR_EMAIL,
      {
        lockedAt: MOCK_NOW,
      },
    );

    await expect(
      getMemberStudioAccess(tenant().id, id),
    ).resolves.toBeUndefined();
  });

  it('finds no member for an id that is not a UUID', async () => {
    await expect(
      getMemberStudioAccess(tenant().id, faker.lorem.word()),
    ).resolves.toBeUndefined();
  });
});
