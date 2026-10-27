import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_INVITE_EMAIL,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_USER_EMAIL,
  MOCK_USER_NAME,
  insertTestLead,
  insertTestTenant,
  insertTestUser,
  type TTestDb,
} from '@blog/db/testing/fixtures';

export const MOCK_NO_GAPS = {
  users: 0,
  subscribers: 0,
  membership_invites: 0,
  leads: 0,
};

export async function seedPlainPersonalDataRows(db: TTestDb): Promise<void> {
  const { id: tenantId } = await insertTestTenant(db);
  await insertTestUser(db, { name: MOCK_USER_NAME, email: MOCK_USER_EMAIL });
  await db
    .insert(schema.subscribers)
    .values({ tenantId, email: MOCK_SUBSCRIBER_EMAIL });
  await db.insert(schema.membershipInvites).values({
    tenantId,
    email: MOCK_INVITE_EMAIL,
    role: MEMBERSHIP_ROLE.EDITOR,
  });
  await insertTestLead(db, tenantId);
}
