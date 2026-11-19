import { faker } from '@faker-js/faker';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { updateDisplayName } from '@shinefold/db/queries/account/update-display-name';
import { createLead } from '@shinefold/db/queries/leads/create-lead';
import { createMembershipInvite } from '@shinefold/db/queries/membership-invites/create-membership-invite';
import { createPendingSubscriber } from '@shinefold/db/queries/subscribers/create-pending-subscriber';
import { applyOwnerEmailChange } from '@shinefold/db/queries/tenants/update-tenant-details/owner-email-change';
import * as schema from '@shinefold/db/schema';
import {
  insertTestReader,
  MOCK_INVITE_EMAIL,
  MOCK_LEAD_EMAIL,
  MOCK_LEAD_MESSAGE,
  MOCK_LEAD_NAME,
  MOCK_OWNER_EMAIL,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_USER_EMAIL,
  MOCK_USER_NAME,
} from '@shinefold/db/testing/fixtures';
import { inviteOf } from '@shinefold/db/testing/membership-invites/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { sql } from 'drizzle-orm';

vi.mock('@shinefold/db/client');

faker.seed(5666);

const PLAIN_USER_COLUMNS = ['email', 'name'];
const DROPPED_PLAIN_COLUMNS = {
  subscribers: ['email'],
  membership_invites: ['email'],
  leads: ['name', 'email', 'message'],
};

const db = useQueryTestDb();
const tenant = useTestTenant(db);

async function existingColumns(
  table: string,
  columns: string[],
): Promise<string[]> {
  const { rows } = await db().execute<{ column_name: string }>(
    sql`select column_name from information_schema.columns where table_name = ${table} and column_name in ${columns}`,
  );
  return rows.map(({ column_name: column }) => column);
}

async function countPlainUserValues(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const column of PLAIN_USER_COLUMNS) {
    const {
      rows: [row],
    } = await db().execute<{ count: number }>(
      sql`select count(${sql.identifier(column)})::int as count from ${schema.users}`,
    );
    counts[column] = row?.count ?? 0;
  }
  return counts;
}

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.subscribers);
  await db().delete(schema.users);
});

describe('plain personal data', () => {
  it.each(Object.entries(DROPPED_PLAIN_COLUMNS))(
    'has no readable column on %s',
    async (table, columns) => {
      await expect(existingColumns(table, columns)).resolves.toEqual([]);
    },
  );

  it('is never written to a user by a write path that takes an email or name', async () => {
    const { id: tenantId } = tenant();
    const { id: userId } = await insertTestReader(db(), MOCK_USER_EMAIL);
    const invite = inviteOf(
      await createMembershipInvite(
        tenantId,
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
      ),
    );

    await updateDisplayName(userId, MOCK_USER_NAME);
    await createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL);
    await createLead({
      tenantId,
      name: MOCK_LEAD_NAME,
      email: MOCK_LEAD_EMAIL,
      message: MOCK_LEAD_MESSAGE,
      sourcePath: `/${faker.lorem.slug()}`,
    });
    await applyOwnerEmailChange({
      tenantId,
      previousEmail: MOCK_INVITE_EMAIL,
      email: MOCK_OWNER_EMAIL,
      grant: { inviteId: invite.id },
    });

    const counts = await countPlainUserValues();

    expect(counts).toEqual({ email: 0, name: 0 });
  });
});
