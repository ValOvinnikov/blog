import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import { firstRowOrThrow } from '@blog/db/testing/first-row-or-throw';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { faker } from '@faker-js/faker';

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
