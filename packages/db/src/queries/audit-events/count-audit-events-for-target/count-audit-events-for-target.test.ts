import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { MOCK_OPERATOR_EMAIL } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { countAuditEventsForTarget } from './count-audit-events-for-target';

faker.seed(5783);

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const MOCK_TARGET_ID = faker.string.uuid();

async function insertTenantEvent(targetId: string): Promise<void> {
  await db().insert(schema.auditEvents).values({
    actorId: faker.string.uuid(),
    actorEmail: MOCK_OPERATOR_EMAIL,
    action: AUDIT_ACTION.SETTINGS_UPDATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId,
  });
}

afterEach(async () => {
  await db().delete(schema.auditEvents);
});

describe(countAuditEventsForTarget, () => {
  it('counts every event recorded against the target', async () => {
    await insertTenantEvent(MOCK_TARGET_ID);
    await insertTenantEvent(MOCK_TARGET_ID);

    await expect(
      countAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, MOCK_TARGET_ID),
    ).resolves.toBe(2);
  });

  it("does not count another target's events", async () => {
    await insertTenantEvent(faker.string.uuid());

    await expect(
      countAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, MOCK_TARGET_ID),
    ).resolves.toBe(0);
  });
});
