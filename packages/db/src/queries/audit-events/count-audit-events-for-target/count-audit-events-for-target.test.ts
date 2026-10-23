import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { countAuditEventsForTarget } from './count-audit-events-for-target';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const MOCK_TENANT_ID = 'tenant-1';

async function insertTenantEvent(targetId: string): Promise<void> {
  await db().insert(schema.auditEvents).values({
    actorId: 'admin-1',
    actorEmail: 'admin-1@example.com',
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
    await insertTenantEvent(MOCK_TENANT_ID);
    await insertTenantEvent(MOCK_TENANT_ID);

    await expect(
      countAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, MOCK_TENANT_ID),
    ).resolves.toBe(2);
  });

  it("does not count another target's events", async () => {
    await insertTenantEvent('tenant-2');

    await expect(
      countAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, MOCK_TENANT_ID),
    ).resolves.toBe(0);
  });
});
