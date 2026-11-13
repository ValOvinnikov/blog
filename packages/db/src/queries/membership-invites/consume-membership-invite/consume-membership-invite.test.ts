import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  insertTestUser,
  MOCK_INVITE_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@blog/db/testing/membership-invites/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
  MOCK_MISSING_USER_ID,
} from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { consumeMembershipInvite } from './consume-membership-invite';

vi.mock('@blog/db/client');

faker.seed(6022);

const MOCK_MISSING_INVITE_ID = faker.string.uuid();

const db = useQueryTestDb();

async function readInvite(inviteId: string) {
  const [invite] = await db()
    .select()
    .from(schema.membershipInvites)
    .where(eq(schema.membershipInvites.id, inviteId));
  return invite;
}

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.memberships);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(consumeMembershipInvite, () => {
  let tenantId: string;
  let inviteId: string;

  beforeEach(async () => {
    vi.useFakeTimers({ now: MOCK_INVITE_CONSUMED_AT, toFake: ['Date'] });
    await insertTestUser(db(), { id: MOCK_USER_ID });
    ({ id: tenantId } = await insertTestTenant(db()));
    ({ id: inviteId } = await mockMembershipInvite(db(), tenantId, {
      email: MOCK_INVITE_EMAIL,
    }));
  });

  it('inserts the real membership row and stamps consumedAt', async () => {
    const membership = await consumeMembershipInvite(inviteId, MOCK_USER_ID);

    const invite = await readInvite(inviteId);
    const rows = await db().select().from(schema.memberships);
    expect(rows).toEqual([membership]);
    expect(membership?.role).toBe(MEMBERSHIP_ROLE.OWNER);
    expect(membership?.tenantId).toBe(tenantId);
    expect(membership?.userId).toBe(MOCK_USER_ID);
    expect(invite?.consumedAt).toEqual(MOCK_INVITE_CONSUMED_AT);
  });

  it('is a no-op returning undefined for an already-consumed invite', async () => {
    const first = await consumeMembershipInvite(inviteId, MOCK_USER_ID);

    const second = await consumeMembershipInvite(inviteId, MOCK_USER_ID);

    const rows = await db().select().from(schema.memberships);
    expect(second).toBeUndefined();
    expect(rows).toEqual([first]);
  });

  it('returns undefined for an invite id that does not exist', async () => {
    const result = await consumeMembershipInvite(
      MOCK_MISSING_INVITE_ID,
      MOCK_USER_ID,
    );

    expect(result).toBeUndefined();
  });

  it('rolls back the claim when the membership insert fails, keeping it retryable', async () => {
    await expect(
      consumeMembershipInvite(inviteId, MOCK_MISSING_USER_ID),
    ).rejects.toThrow();

    const pendingInvite = await readInvite(inviteId);
    expect(pendingInvite?.consumedAt).toBeNull();

    await insertTestUser(db(), { id: MOCK_MISSING_USER_ID });
    const membership = await consumeMembershipInvite(
      inviteId,
      MOCK_MISSING_USER_ID,
    );

    const rows = await db().select().from(schema.memberships);
    expect(rows).toEqual([membership]);
  });

  it('returns the existing membership when the pair already has one', async () => {
    const existingMembership = await mockMembership(db(), {
      userId: MOCK_USER_ID,
      tenantId,
      role: MEMBERSHIP_ROLE.READER,
    });

    const membership = await consumeMembershipInvite(inviteId, MOCK_USER_ID);

    const rows = await db().select().from(schema.memberships);
    expect(membership).toEqual(existingMembership);
    expect(rows).toEqual([existingMembership]);
  });

  describe('an editor invite on a site whose owner already holds a seat', () => {
    let editorInviteId: string;

    beforeEach(async () => {
      const { id: ownerId } = await insertTestUser(db(), {
        id: faker.string.uuid(),
      });
      await mockMembership(db(), { userId: ownerId, tenantId });
      ({ id: editorInviteId } = await mockMembershipInvite(db(), tenantId, {
        role: MEMBERSHIP_ROLE.EDITOR,
      }));
    });

    it('stays pending while the Free plan has no seat left', async () => {
      const membership = await consumeMembershipInvite(
        editorInviteId,
        MOCK_USER_ID,
      );

      expect(membership).toBeUndefined();
      expect((await readInvite(editorInviteId))?.consumedAt).toBeNull();
    });

    it('is accepted once the plan has a seat for it', async () => {
      await db()
        .update(schema.tenants)
        .set({ plan: TENANT_PLAN.GROWTH })
        .where(eq(schema.tenants.id, tenantId));

      const membership = await consumeMembershipInvite(
        editorInviteId,
        MOCK_USER_ID,
      );

      expect(membership?.role).toBe(MEMBERSHIP_ROLE.EDITOR);
    });
  });
});
