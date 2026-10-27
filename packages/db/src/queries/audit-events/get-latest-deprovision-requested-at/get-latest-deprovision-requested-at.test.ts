import { AUDIT_ACTION } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestAuditEvent } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { getLatestDeprovisionRequestedAt } from './get-latest-deprovision-requested-at';

faker.seed(602102);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_TENANT_ID = faker.string.uuid();
const MOCK_OTHER_TENANT_ID = faker.string.uuid();
const MOCK_OLDEST_AT = new Date(2026, 0, 1);
const MOCK_MIDDLE_AT = new Date(2026, 0, 2);
const MOCK_LATEST_AT = new Date(2026, 0, 3);

afterEach(async () => {
  await db().delete(schema.auditEvents);
});

describe(getLatestDeprovisionRequestedAt, () => {
  it('returns the most recent request timestamp when several exist', async () => {
    await insertTestAuditEvent(db(), {
      targetId: MOCK_TENANT_ID,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      createdAt: MOCK_OLDEST_AT,
    });
    await insertTestAuditEvent(db(), {
      targetId: MOCK_TENANT_ID,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      createdAt: MOCK_LATEST_AT,
    });
    await insertTestAuditEvent(db(), {
      targetId: MOCK_TENANT_ID,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      createdAt: MOCK_MIDDLE_AT,
    });

    const result = await getLatestDeprovisionRequestedAt(MOCK_TENANT_ID);

    expect(result).toEqual(MOCK_LATEST_AT);
  });

  it('returns undefined when no request event exists for the tenant', async () => {
    const result = await getLatestDeprovisionRequestedAt(MOCK_TENANT_ID);

    expect(result).toBeUndefined();
  });

  it('ignores events for a different tenant', async () => {
    await insertTestAuditEvent(db(), {
      targetId: MOCK_OTHER_TENANT_ID,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      createdAt: MOCK_OLDEST_AT,
    });

    const result = await getLatestDeprovisionRequestedAt(MOCK_TENANT_ID);

    expect(result).toBeUndefined();
  });

  it('ignores other action types for the same tenant', async () => {
    await insertTestAuditEvent(db(), {
      targetId: MOCK_TENANT_ID,
      action: AUDIT_ACTION.DEPROVISIONED,
      createdAt: MOCK_OLDEST_AT,
    });

    const result = await getLatestDeprovisionRequestedAt(MOCK_TENANT_ID);

    expect(result).toBeUndefined();
  });
});
