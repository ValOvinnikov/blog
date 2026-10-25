import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { findPendingInviteByEmail } from './find-pending-invite-by-email';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

async function insertInvite(
  tenantId: string,
  email: string,
  consumed = false,
): Promise<void> {
  await db()
    .insert(schema.membershipInvites)
    .values({
      tenantId,
      email,
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: consumed ? new Date() : null,
    });
}

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

describe(findPendingInviteByEmail, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns a pending invite matching the normalized email', async () => {
    await insertInvite(tenantId, MOCK_INVITE_EMAIL);

    const results = await findPendingInviteByEmail(
      MOCK_INVITE_EMAIL.toUpperCase(),
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ tenantId, email: MOCK_INVITE_EMAIL });
  });

  it('matches an email padded with leading/trailing whitespace', async () => {
    await insertInvite(tenantId, MOCK_INVITE_EMAIL);

    const results = await findPendingInviteByEmail(`  ${MOCK_INVITE_EMAIL}  `);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ tenantId, email: MOCK_INVITE_EMAIL });
  });

  it('excludes already-consumed invites', async () => {
    await insertInvite(tenantId, MOCK_INVITE_EMAIL, true);

    const results = await findPendingInviteByEmail(MOCK_INVITE_EMAIL);

    expect(results).toHaveLength(0);
  });

  it('returns every pending invite across multiple tenants for the same email', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await insertInvite(tenantOneId, MOCK_INVITE_EMAIL);
    await insertInvite(tenantTwoId, MOCK_INVITE_EMAIL);

    const results = await findPendingInviteByEmail(MOCK_INVITE_EMAIL);

    expect(results).toHaveLength(2);
    expect(results.map((invite) => invite.tenantId).sort()).toEqual(
      [tenantOneId, tenantTwoId].sort(),
    );
  });

  it('returns an empty array when no invite matches', async () => {
    const results = await findPendingInviteByEmail('nobody@example.com');

    expect(results).toEqual([]);
  });
});
