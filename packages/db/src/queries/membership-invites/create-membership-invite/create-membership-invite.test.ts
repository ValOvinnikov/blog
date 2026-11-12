import {
  MEMBERSHIP_INVITE_OUTCOME,
  MEMBERSHIP_ROLE,
  PLAN_ENTITLEMENTS,
  TENANT_PLAN,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TMembershipInvite } from '@blog/db/schema/membership-invites';
import {
  insertTestTenant,
  insertTestUser,
  MOCK_INVITE_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  deleteSeatRows,
  inviteOf,
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@blog/db/testing/membership-invites/fixtures';
import { mockMembership } from '@blog/db/testing/memberships/fixtures';
import {
  decryptTestPersonalValue,
  mockAccountEmailIndex,
  testPersonalEmailIndex,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { patchTestTenant } from '@blog/db/testing/test-tenant';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { createMembershipInvite } from './create-membership-invite';

vi.mock('@blog/db/client');

faker.seed(6022);

const { CREATED, ALREADY_PENDING, ALREADY_CONSUMED, SEAT_LIMIT } =
  MEMBERSHIP_INVITE_OUTCOME;
const GROWTH_SEATS = PLAN_ENTITLEMENTS[TENANT_PLAN.GROWTH].seats;

const db = useQueryTestDb();

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(createMembershipInvite, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a new pending invite, normalizing the email', async () => {
    const result = await createMembershipInvite(
      tenantId,
      MOCK_INVITE_EMAIL.toUpperCase(),
      MEMBERSHIP_ROLE.OWNER,
    );
    const invite = inviteOf(result);

    const rows = await db().select().from(schema.membershipInvites);
    expect(result.outcome).toBe(CREATED);
    expect(rows).toEqual([invite]);
    expect(invite).toEqual({
      id: invite.id,
      createdAt: invite.createdAt,
      tenantId,
      emailEncrypted: invite.emailEncrypted,
      emailIndex: testPersonalEmailIndex(MOCK_INVITE_EMAIL),
      emailExactIndex: mockAccountEmailIndex(MOCK_INVITE_EMAIL),
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: null,
    });
    expect(decryptTestPersonalValue(invite.emailEncrypted)).toBe(
      MOCK_INVITE_EMAIL,
    );
  });

  describe('with a pending invite', () => {
    let first: TMembershipInvite;

    beforeEach(async () => {
      first = inviteOf(
        await createMembershipInvite(
          tenantId,
          MOCK_INVITE_EMAIL,
          MEMBERSHIP_ROLE.OWNER,
        ),
      );
    });

    it.each([
      { variant: 'the same', email: MOCK_INVITE_EMAIL },
      {
        variant: 'a differently cased',
        email: MOCK_INVITE_EMAIL.toUpperCase(),
      },
      { variant: 'a space-padded', email: `  ${MOCK_INVITE_EMAIL}  ` },
    ])(
      'returns the existing pending invite for $variant email',
      async ({ email }) => {
        const second = await createMembershipInvite(
          tenantId,
          email,
          MEMBERSHIP_ROLE.EDITOR,
        );

        const rows = await db().select().from(schema.membershipInvites);
        expect(second).toEqual({
          outcome: ALREADY_PENDING,
          invite: first,
        });
        expect(rows).toEqual([first]);
      },
    );

    it('reports already-consumed when the original invite was consumed', async () => {
      await db()
        .update(schema.membershipInvites)
        .set({ consumedAt: MOCK_INVITE_CONSUMED_AT })
        .where(eq(schema.membershipInvites.id, first.id));

      const second = await createMembershipInvite(
        tenantId,
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
      );

      expect(second.outcome).toBe(ALREADY_CONSUMED);
    });
  });

  it('allows the same email to hold a distinct pending invite on a different tenant', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());

    await createMembershipInvite(
      tenantOneId,
      MOCK_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );
    await createMembershipInvite(
      tenantTwoId,
      MOCK_INVITE_EMAIL,
      MEMBERSHIP_ROLE.READER,
    );

    const rows = await db().select().from(schema.membershipInvites);
    expect(rows).toHaveLength(2);
  });

  describe('seat limit', () => {
    function inviteNew(onTenantId: string) {
      return createMembershipInvite(
        onTenantId,
        faker.internet.email(),
        MEMBERSHIP_ROLE.EDITOR,
      );
    }

    function inviteRows(onTenantId: string) {
      return db()
        .select()
        .from(schema.membershipInvites)
        .where(eq(schema.membershipInvites.tenantId, onTenantId));
    }

    it('refuses a FREE tenant an invite beyond its owner and writes nothing', async () => {
      const { id: userId } = await insertTestUser(db());
      await mockMembership(db(), { userId, tenantId });

      const result = await inviteNew(tenantId);

      expect(result).toEqual({ outcome: SEAT_LIMIT });
      expect(await inviteRows(tenantId)).toEqual([]);
    });

    it('counts a pending invite as a taken seat', async () => {
      await mockMembershipInvite(db(), tenantId);

      const result = await inviteNew(tenantId);

      expect(result.outcome).toBe(SEAT_LIMIT);
      expect(await inviteRows(tenantId)).toHaveLength(1);
    });

    describe('on a GROWTH tenant', () => {
      let growthTenantId: string;

      beforeEach(async () => {
        ({ id: growthTenantId } = await insertTestTenant(db(), {
          plan: TENANT_PLAN.GROWTH,
        }));
      });

      it('invites up to its seats and refuses the next', async () => {
        const outcomes = [];
        for (let seat = 0; seat <= GROWTH_SEATS; seat++) {
          outcomes.push((await inviteNew(growthTenantId)).outcome);
        }

        expect(outcomes).toEqual([
          ...Array<string>(GROWTH_SEATS).fill(CREATED),
          SEAT_LIMIT,
        ]);
        expect(await inviteRows(growthTenantId)).toHaveLength(GROWTH_SEATS);
      });

      it('does not count a consumed invite beside the membership it became', async () => {
        const { id: userId } = await insertTestUser(db());
        await mockMembership(db(), { userId, tenantId: growthTenantId });
        await mockMembershipInvite(db(), growthTenantId, {
          consumedAt: MOCK_INVITE_CONSUMED_AT,
        });

        const second = await inviteNew(growthTenantId);
        const third = await inviteNew(growthTenantId);

        expect(second.outcome).toBe(CREATED);
        expect(third.outcome).toBe(CREATED);
      });

      it('keeps every invite after a downgrade and refuses the next', async () => {
        await inviteNew(growthTenantId);
        await inviteNew(growthTenantId);
        await patchTestTenant(db(), growthTenantId, { plan: TENANT_PLAN.FREE });

        const result = await inviteNew(growthTenantId);

        expect(result.outcome).toBe(SEAT_LIMIT);
        expect(await inviteRows(growthTenantId)).toHaveLength(2);
      });
    });
  });

  it('rejects an invite for a tenant that does not exist', async () => {
    await expect(
      createMembershipInvite(
        MOCK_MISSING_TENANT_ID,
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
      ),
    ).rejects.toThrow();
  });
});
