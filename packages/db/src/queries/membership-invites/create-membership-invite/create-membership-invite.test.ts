import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { createMembershipInvite } from './create-membership-invite';

vi.mock('@blog/db/client');

const ALREADY_PENDING = 'already-pending';

const db = useQueryTestDb();
usePersonalDataKeys();

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
    const result = await createMembershipInvite(
      tenantId,
      MOCK_INVITE_EMAIL.toUpperCase(),
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(result.outcome).toBe('created');
    expect(result.invite).toMatchObject({
      tenantId,
      email: MOCK_INVITE_EMAIL,
      emailIndex: testPersonalEmailIndex(MOCK_INVITE_EMAIL),
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: null,
    });
    expect(decryptTestPersonalValue(result.invite.emailEncrypted)).toBe(
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
      'returns the pending invite for $variant email instead of a duplicate',
      async ({ email }) => {
        const second = await createMembershipInvite(
          tenantId,
          email,
          MEMBERSHIP_ROLE.EDITOR,
        );

        expect(second.outcome).toBe(ALREADY_PENDING);
        expect(second.invite).toEqual(first.invite);
        const rows = await db().select().from(schema.membershipInvites);
        expect(rows).toHaveLength(1);
      },
    );

    it('reports already-consumed for a duplicate invite whose original was already consumed', async () => {
      await db()
        .update(schema.membershipInvites)
        .set({ consumedAt: new Date() })
        .where(eq(schema.membershipInvites.id, first.invite.id));

      const second = await createMembershipInvite(
        tenantId,
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
      );

      expect(second.outcome).toBe('already-consumed');
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
        '00000000-0000-0000-0000-000000000000',
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
      ),
    ).rejects.toThrow();
  });
});
