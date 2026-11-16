import { faker } from '@faker-js/faker';
import { AUDIT_TARGET_TYPE } from '@shinefold/config/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestAuditEvent } from '@shinefold/db/testing/audit-events/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { countAuditEventsForTarget } from './count-audit-events-for-target';

faker.seed(602101);

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const MOCK_TARGET_ID = faker.string.uuid();

afterEach(async () => {
  await db().delete(schema.auditEvents);
});

describe(countAuditEventsForTarget, () => {
  it('counts every event recorded against the target', async () => {
    await insertTestAuditEvent(db(), { targetId: MOCK_TARGET_ID });
    await insertTestAuditEvent(db(), { targetId: MOCK_TARGET_ID });

    await expect(
      countAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, MOCK_TARGET_ID),
    ).resolves.toBe(2);
  });

  it("does not count another target's events", async () => {
    await insertTestAuditEvent(db());

    await expect(
      countAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, MOCK_TARGET_ID),
    ).resolves.toBe(0);
  });
});
