import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { updateDisplayName } from '@blog/db/queries/account/update-display-name';
import { createLead } from '@blog/db/queries/leads/create-lead';
import { createMembershipInvite } from '@blog/db/queries/membership-invites/create-membership-invite';
import { createPendingSubscriber } from '@blog/db/queries/subscribers/create-pending-subscriber';
import { applyOwnerEmailChange } from '@blog/db/queries/tenants/update-tenant-details/owner-email-change';
import * as schema from '@blog/db/schema';
import {
  insertTestReader,
  insertTestTenant,
  MOCK_INVITE_EMAIL,
  MOCK_LEAD_EMAIL,
  MOCK_LEAD_MESSAGE,
  MOCK_LEAD_NAME,
  MOCK_OWNER_EMAIL,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_USER_EMAIL,
  MOCK_USER_NAME,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

vi.mock('@blog/db/client');

faker.seed(5666);

const PLAIN_PERSONAL_COLUMNS = {
  users: ['email', 'name'],
  subscribers: ['email'],
  membership_invites: ['email'],
  leads: ['name', 'email', 'message'],
};

const db = useQueryTestDb();

async function countPlainValues(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const [table, columns] of Object.entries(PLAIN_PERSONAL_COLUMNS)) {
    const { rows } = await db().execute<{ column_name: string }>(
      sql`select column_name from information_schema.columns where table_name = ${table} and column_name in ${columns}`,
    );
    for (const { column_name: column } of rows) {
      const {
        rows: [row],
      } = await db().execute<{ count: number }>(
        sql`select count(${sql.identifier(column)})::int as count from ${sql.identifier(table)}`,
      );
      counts[`${table}.${column}`] = row?.count ?? 0;
    }
  }
  return counts;
}

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe('plain personal data', () => {
  it('is never written by a write path that takes an email, name or message', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const { id: userId } = await insertTestReader(db(), MOCK_USER_EMAIL);
    const { invite } = await createMembershipInvite(
      tenantId,
      MOCK_INVITE_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
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

    const counts = await countPlainValues();

    expect(Object.entries(counts).filter(([, count]) => count > 0)).toEqual([]);
  });
});
