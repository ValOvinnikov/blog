import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { BLOCKED_IDENTITY_KIND, MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { MOCK_BLOCK_REASON } from '@blog/db/testing/blocked-signup-identities/fixtures';
import {
  insertTestLead,
  insertTestReader,
  type TTestDb,
} from '@blog/db/testing/fixtures';
import {
  encryptPersonalValue,
  emailColumns,
} from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';
import { eq } from 'drizzle-orm';

export const MOCK_PERSONAL_DATA_LEAD_NAME = 'Grace Hopper';
export const MOCK_PERSONAL_DATA_LEAD_MESSAGE = 'Please call me back.';

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
  const columns = emailColumns(email, personalDataIndex);
  const { emailIndex } = columns;
  if (!emailIndex) throw new Error('Stub the personal data keys first.');

  await db.insert(schema.subscribers).values({ tenantId, email, ...columns });
  await insertTestLead(db, tenantId, {
    email,
    ...columns,
    name: MOCK_PERSONAL_DATA_LEAD_NAME,
    nameEncrypted: encryptPersonalValue(MOCK_PERSONAL_DATA_LEAD_NAME),
    message: MOCK_PERSONAL_DATA_LEAD_MESSAGE,
    messageEncrypted: encryptPersonalValue(MOCK_PERSONAL_DATA_LEAD_MESSAGE),
  });
  await db.insert(schema.membershipInvites).values({
    tenantId,
    email,
    ...columns,
    role: MEMBERSHIP_ROLE.EDITOR,
  });
  await db.insert(schema.blockedSignupIdentities).values({
    kind: BLOCKED_IDENTITY_KIND.ADDRESS,
    value: emailIndex,
    reason: MOCK_BLOCK_REASON,
  });
  const { id: actorId } = await insertTestReader(db, email);
  await db.insert(schema.auditEvents).values({
    actorId,
    action: AUDIT_ACTION.SETTINGS_UPDATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
  });
}

export async function findTestReaderId(
  db: TTestDb,
  email: string,
): Promise<TMaybeUndefined<string>> {
  const [reader] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email));
  return reader?.id;
}

export async function getTestReaderId(
  db: TTestDb,
  email: string,
): Promise<string> {
  const id = await findTestReaderId(db, email);
  if (!id) throw new Error('Seed the reader first.');
  return id;
}

export async function deleteTestPersonalDataRows(db: TTestDb): Promise<void> {
  await db.delete(schema.auditEvents);
  await db.delete(schema.blockedSignupIdentities);
  await db.delete(schema.membershipInvites);
  await db.delete(schema.leads);
  await db.delete(schema.subscribers);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
}
