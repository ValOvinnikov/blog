import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, TEST_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { createMembershipInvite } from './create-membership-invite';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const ALREADY_PENDING = 'already-pending';

const db = useQueryTestDb(getDbMock);
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
      TEST_INVITE_EMAIL.toUpperCase(),
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(result.outcome).toBe('created');
    expect(result.invite).toMatchObject({
      tenantId,
      email: TEST_INVITE_EMAIL,
      emailIndex: testPersonalEmailIndex(TEST_INVITE_EMAIL),
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: null,
    });
    expect(decryptTestPersonalValue(result.invite.emailEncrypted)).toBe(
      TEST_INVITE_EMAIL,
    );
  });

  it('is idempotent for a duplicate pending invite to the same tenant + email', async () => {
    const first = await createMembershipInvite(
      tenantId,
      TEST_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );

    const second = await createMembershipInvite(
      tenantId,
      TEST_INVITE_EMAIL,
      MEMBERSHIP_ROLE.EDITOR,
    );

    expect(second.outcome).toBe(ALREADY_PENDING);
    expect(second.invite).toEqual(first.invite);
    const rows = await db().select().from(schema.membershipInvites);
    expect(rows).toHaveLength(1);
  });

  it('is idempotent (case-insensitively) for a duplicate invite with different casing', async () => {
    await createMembershipInvite(
      tenantId,
      TEST_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );

    const result = await createMembershipInvite(
      tenantId,
      TEST_INVITE_EMAIL.toUpperCase(),
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(result.outcome).toBe(ALREADY_PENDING);
    const rows = await db().select().from(schema.membershipInvites);
    expect(rows).toHaveLength(1);
  });

  it('is idempotent (trimming whitespace) for a duplicate invite padded with leading/trailing spaces', async () => {
    await createMembershipInvite(
      tenantId,
      TEST_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );

    const result = await createMembershipInvite(
      tenantId,
      `  ${TEST_INVITE_EMAIL}  `,
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(result.outcome).toBe(ALREADY_PENDING);
    const rows = await db().select().from(schema.membershipInvites);
    expect(rows).toHaveLength(1);
  });

  it('reports already-consumed for a duplicate invite whose original was already consumed', async () => {
    const first = await createMembershipInvite(
      tenantId,
      TEST_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );
    await db()
      .update(schema.membershipInvites)
      .set({ consumedAt: new Date() })
      .where(eq(schema.membershipInvites.id, first.invite.id));

    const second = await createMembershipInvite(
      tenantId,
      TEST_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(second.outcome).toBe('already-consumed');
  });

  it('allows the same email to hold a distinct pending invite on a different tenant', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());

    await createMembershipInvite(
      tenantOneId,
      TEST_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );
    await createMembershipInvite(
      tenantTwoId,
      TEST_INVITE_EMAIL,
      MEMBERSHIP_ROLE.READER,
    );

    const rows = await db().select().from(schema.membershipInvites);
    expect(rows).toHaveLength(2);
  });

  it('rejects an invite for a tenant that does not exist', async () => {
    await expect(
      createMembershipInvite(
        '00000000-0000-0000-0000-000000000000',
        TEST_INVITE_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
      ),
    ).rejects.toThrow();
  });
});
