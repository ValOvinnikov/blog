import { AUDIT_EVENT_RETENTION_MONTHS } from '@blog/db/constants';
import { monthsBefore } from '@blog/db/queries/retention/retention-cutoff';
import * as schema from '@blog/db/schema';
import { insertTestAuditEvent } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  justPast,
  justWithin,
  MOCK_RETENTION_LIMIT,
  MOCK_RETENTION_NOW,
} from '@blog/db/testing/retention/fixtures';

import { deleteAuditEventsPastRetention } from './delete-audit-events-past-retention';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const CUTOFF = monthsBefore(MOCK_RETENTION_NOW, AUDIT_EVENT_RETENTION_MONTHS);

afterEach(async () => {
  await db().delete(schema.auditEvents);
});

describe(deleteAuditEventsPastRetention, () => {
  it('deletes the events written before the period and keeps newer ones', async () => {
    await insertTestAuditEvent(db(), { createdAt: justPast(CUTOFF) });
    const recent = await insertTestAuditEvent(db(), {
      createdAt: justWithin(CUTOFF),
    });

    await expect(
      deleteAuditEventsPastRetention(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT),
    ).resolves.toBe(1);

    const rows = await db()
      .select({ id: schema.auditEvents.id })
      .from(schema.auditEvents);
    expect(rows).toEqual([{ id: recent.id }]);
  });

  it('deletes at most the given number of events per call', async () => {
    await insertTestAuditEvent(db(), { createdAt: justPast(CUTOFF) });
    await insertTestAuditEvent(db(), { createdAt: justPast(CUTOFF) });

    await expect(
      deleteAuditEventsPastRetention(MOCK_RETENTION_NOW, 1),
    ).resolves.toBe(1);

    const rows = await db()
      .select({ id: schema.auditEvents.id })
      .from(schema.auditEvents);
    expect(rows).toHaveLength(1);
  });

  it('deletes nothing when run a second time', async () => {
    await insertTestAuditEvent(db(), { createdAt: justPast(CUTOFF) });
    await deleteAuditEventsPastRetention(
      MOCK_RETENTION_NOW,
      MOCK_RETENTION_LIMIT,
    );

    await expect(
      deleteAuditEventsPastRetention(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT),
    ).resolves.toBe(0);
  });
});
