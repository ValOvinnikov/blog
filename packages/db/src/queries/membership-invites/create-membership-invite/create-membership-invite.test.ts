import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import { MOCK_INVITE_CONSUMED_AT } from '@blog/db/testing/membership-invites/fixtures';
import {
  decryptTestPersonalValue,
  mockAccountEmailIndex,
  testPersonalEmailIndex,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { createMembershipInvite } from './create-membership-invite';

vi.mock('@blog/db/client');

faker.seed(6022);

const OUTCOME_CREATED = 'created';
const OUTCOME_ALREADY_PENDING = 'already-pending';
const OUTCOME_ALREADY_CONSUMED = 'already-consumed';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

describe(createMembershipInvite, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a new pending invite, normalizing the email', async () => {
    const { outcome, invite } = await createMembershipInvite(
      tenantId,
      MOCK_INVITE_EMAIL.toUpperCase(),
      MEMBERSHIP_ROLE.OWNER,
    );

    const rows = await db().select().from(schema.membershipInvites);
    expect(outcome).toBe(OUTCOME_CREATED);
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
    let first: Awaited<ReturnType<typeof createMembershipInvite>>;

    beforeEach(async () => {
      first = await createMembershipInvite(
        tenantId,
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
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
        expect(second.outcome).toBe(OUTCOME_ALREADY_PENDING);
        expect(second.invite).toEqual(first.invite);
        expect(rows).toEqual([first.invite]);
      },
    );

    it('reports already-consumed when the original invite was consumed', async () => {
      await db()
        .update(schema.membershipInvites)
        .set({ consumedAt: MOCK_INVITE_CONSUMED_AT })
        .where(eq(schema.membershipInvites.id, first.invite.id));

      const second = await createMembershipInvite(
        tenantId,
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
      );

      expect(second.outcome).toBe(OUTCOME_ALREADY_CONSUMED);
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
