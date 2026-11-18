import { faker } from '@faker-js/faker';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { insertTestMember } from '@shinefold/db/testing/memberships/fixtures';
import {
  mockMemberStudioAccess,
  toMemberStudioAccessColumns,
} from '@shinefold/db/testing/memberships/studio-access';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { eq } from 'drizzle-orm';

import { clearMemberStudioAccess } from './clear-member-studio-access';

vi.mock('@shinefold/db/client');

faker.seed(76072);

const db = useQueryTestDb();

const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(clearMemberStudioAccess, () => {
  it('empties the recorded Studio access and keeps the membership', async () => {
    const member = await insertTestMember(
      db(),
      tenant().id,
      faker.internet.email(),
      {
        role: MEMBERSHIP_ROLE.EDITOR,
        lockedAt: MOCK_NOW,
        ...toMemberStudioAccessColumns(mockMemberStudioAccess()),
      },
    );

    await expect(clearMemberStudioAccess(member.id)).resolves.toBe(true);

    const [stored] = await db()
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.id, member.id));
    expect(stored).toEqual({
      ...member,
      sanityInviteId: null,
      sanityInviteSentAt: null,
      sanityInviteAcceptedAt: null,
      sanityUserId: null,
      sanityLoginProvider: null,
    });
  });

  it.each([
    ['an unknown membership', faker.string.uuid()],
    ['an id that is not a UUID', faker.lorem.word()],
  ])('reports nothing cleared for %s', async (_description, membershipId) => {
    await expect(clearMemberStudioAccess(membershipId)).resolves.toBe(false);
  });
});
