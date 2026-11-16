import { faker } from '@faker-js/faker';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@shinefold/config/constants';
import * as schema from '@shinefold/db/schema';
import type { TAuditEvent } from '@shinefold/db/schema/audit-events';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import type { TTestDb } from '@shinefold/db/testing/fixtures';

export async function insertTestAuditEvent(
  db: TTestDb,
  overrides: Partial<typeof schema.auditEvents.$inferInsert> = {},
): Promise<TAuditEvent> {
  return firstRowOrThrow(
    await db
      .insert(schema.auditEvents)
      .values({
        actorId: faker.string.uuid(),
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: faker.string.uuid(),
        ...overrides,
      })
      .returning(),
    'insertTestAuditEvent',
  );
}
