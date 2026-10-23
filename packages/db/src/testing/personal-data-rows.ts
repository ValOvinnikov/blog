import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND, MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { MOCK_BLOCK_REASON } from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestLead, type TTestDb } from '@blog/db/testing/fixtures';
import {
  encryptPersonalValue,
  personalEmailColumns,
} from '@blog/db/utils/personal-data/personal-data';

export const MOCK_PERSONAL_DATA_LEAD_NAME = 'Grace Hopper';
export const MOCK_PERSONAL_DATA_LEAD_MESSAGE = 'Please call me back.';
export const MOCK_PERSONAL_DATA_ACTOR_ID = 'user-with-remaining-data';

export function taggedMixedCaseAddress(email: string): string {
  const tagged = email.replace(
    /@(.+)$/,
    (_match, domain: string) => `+Promo@${domain.toUpperCase()}`,
  );
  return ` ${tagged} `;
}

export async function insertTestPersonalDataRows(
  db: TTestDb,
  tenantId: string,
  email: string,
): Promise<void> {
  const emailColumns = personalEmailColumns(email);
  const { emailIndex } = emailColumns;
  if (!emailIndex) throw new Error('Stub the personal data keys first.');

  await db
    .insert(schema.subscribers)
    .values({ tenantId, email, ...emailColumns });
  await insertTestLead(db, tenantId, {
    email,
    ...emailColumns,
    name: MOCK_PERSONAL_DATA_LEAD_NAME,
    nameEncrypted: encryptPersonalValue(MOCK_PERSONAL_DATA_LEAD_NAME),
    message: MOCK_PERSONAL_DATA_LEAD_MESSAGE,
    messageEncrypted: encryptPersonalValue(MOCK_PERSONAL_DATA_LEAD_MESSAGE),
  });
  await db.insert(schema.membershipInvites).values({
    tenantId,
    email,
    ...emailColumns,
    role: MEMBERSHIP_ROLE.EDITOR,
  });
  await db.insert(schema.blockedSignupIdentities).values({
    kind: BLOCKED_IDENTITY_KIND.ADDRESS,
    value: emailIndex,
    reason: MOCK_BLOCK_REASON,
  });
  await db.insert(schema.auditEvents).values({
    actorId: MOCK_PERSONAL_DATA_ACTOR_ID,
    actorEmail: taggedMixedCaseAddress(email),
    action: AUDIT_ACTION.SETTINGS_UPDATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
  });
}

export async function deleteTestPersonalDataRows(db: TTestDb): Promise<void> {
  await db.delete(schema.auditEvents);
  await db.delete(schema.blockedSignupIdentities);
  await db.delete(schema.membershipInvites);
  await db.delete(schema.leads);
  await db.delete(schema.subscribers);
  await db.delete(schema.tenants);
}
