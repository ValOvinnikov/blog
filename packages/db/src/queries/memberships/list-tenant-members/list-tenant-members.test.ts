import { faker } from '@faker-js/faker';
import { STUDIO_ACCESS } from '@shinefold/config/constants';
import {
  MEMBERSHIP_ROLE,
  OWNER_ACCESS_STALL_AFTER_MS,
} from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  insertTestTenant,
  MOCK_EMAIL_VERIFIED_AT,
  MOCK_OWNER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { deleteSeatRows } from '@shinefold/db/testing/membership-invites/fixtures';
import { insertTestMember } from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_SANITY_USER_ID } from '@shinefold/db/testing/sanity-management-client/fixtures';
import { eq } from 'drizzle-orm';

import { listTenantMembers } from './list-tenant-members';

vi.mock('@shinefold/db/client');

faker.seed(7167);

const db = useQueryTestDb();

const MOCK_EDITOR_EMAIL = faker.internet.email().toLowerCase();
const MOCK_JOINED_AT = faker.date.past({ refDate: MOCK_NOW });

let tenantId: string;

beforeEach(async () => {
  ({ id: tenantId } = await insertTestTenant(db()));
});

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(listTenantMembers, () => {
  it('lists only this tenant’s members, the owner first, with decrypted emails', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestMember(db(), otherTenantId, faker.internet.email());
    const editor = await insertTestMember(db(), tenantId, MOCK_EDITOR_EMAIL, {
      role: MEMBERSHIP_ROLE.EDITOR,
      createdAt: MOCK_JOINED_AT,
    });
    const owner = await insertTestMember(db(), tenantId, MOCK_OWNER_EMAIL, {
      createdAt: MOCK_NOW,
    });

    const members = await listTenantMembers(tenantId, MOCK_NOW);

    expect(members).toEqual([
      {
        membershipId: owner.id,
        userId: owner.userId,
        email: MOCK_OWNER_EMAIL,
        role: MEMBERSHIP_ROLE.OWNER,
        hasSignedIn: false,
        joinedAt: MOCK_NOW,
        studioAccess: undefined,
      },
      {
        membershipId: editor.id,
        userId: editor.userId,
        email: MOCK_EDITOR_EMAIL,
        role: MEMBERSHIP_ROLE.EDITOR,
        hasSignedIn: false,
        joinedAt: MOCK_JOINED_AT,
        studioAccess: undefined,
      },
    ]);
  });

  it('reports a member who has signed in', async () => {
    const { userId } = await insertTestMember(db(), tenantId, MOCK_OWNER_EMAIL);
    await db()
      .update(schema.users)
      .set({ emailVerified: MOCK_EMAIL_VERIFIED_AT })
      .where(eq(schema.users.id, userId));

    const [member] = await listTenantMembers(tenantId, MOCK_NOW);

    expect(member?.hasSignedIn).toBe(true);
  });

  it.each([
    {
      access: { sanityInviteSentAt: MOCK_NOW },
      expected: STUDIO_ACCESS.INVITE_SENT,
    },
    {
      access: {
        sanityInviteSentAt: new Date(
          MOCK_NOW.getTime() - OWNER_ACCESS_STALL_AFTER_MS,
        ),
      },
      expected: STUDIO_ACCESS.STALLED,
    },
    {
      access: {
        sanityInviteSentAt: MOCK_JOINED_AT,
        sanityUserId: MOCK_SANITY_USER_ID,
      },
      expected: STUDIO_ACCESS.ACTIVATING,
    },
    {
      access: {
        sanityInviteSentAt: MOCK_JOINED_AT,
        sanityInviteAcceptedAt: MOCK_NOW,
        sanityUserId: MOCK_SANITY_USER_ID,
      },
      expected: STUDIO_ACCESS.READY,
    },
  ])(
    'derives the $expected Studio access state',
    async ({ access, expected }) => {
      await insertTestMember(db(), tenantId, MOCK_EDITOR_EMAIL, {
        role: MEMBERSHIP_ROLE.EDITOR,
        ...access,
      });

      const [member] = await listTenantMembers(tenantId, MOCK_NOW);

      expect(member?.studioAccess).toBe(expected);
    },
  );
});
