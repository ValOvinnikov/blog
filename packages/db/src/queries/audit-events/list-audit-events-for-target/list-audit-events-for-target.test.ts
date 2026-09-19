import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TAuditAction,
  type TAuditTargetType,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listAuditEventsForTarget } from './list-audit-events-for-target';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

async function insertEvent(overrides: {
  targetType: TAuditTargetType;
  targetId: string;
  createdAt: Date;
  action?: TAuditAction;
  actorEmail?: string;
}): Promise<void> {
  await db()
    .insert(schema.auditEvents)
    .values({
      actorId: 'admin-1',
      actorEmail: overrides.actorEmail ?? 'admin-1@example.com',
      action: overrides.action ?? AUDIT_ACTION.DEPROVISIONED,
      targetType: overrides.targetType,
      targetId: overrides.targetId,
      createdAt: overrides.createdAt,
    });
}

afterEach(async () => {
  await db().delete(schema.auditEvents);
});

describe(listAuditEventsForTarget, () => {
  it('returns events for the target ordered newest-first', async () => {
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, 1),
      action: AUDIT_ACTION.CREATED,
    });
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, 3),
      action: AUDIT_ACTION.DEPROVISIONED,
    });
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, 2),
      action: AUDIT_ACTION.SETTINGS_UPDATED,
    });

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      'tenant-1',
    );

    expect(result.map((event) => event.action)).toEqual([
      AUDIT_ACTION.DEPROVISIONED,
      AUDIT_ACTION.SETTINGS_UPDATED,
      AUDIT_ACTION.CREATED,
    ]);
  });

  it('defaults to a limit of 20 events', async () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, index + 1),
    }));
    for (const row of rows) {
      await insertEvent(row);
    }

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      'tenant-1',
    );

    expect(result).toHaveLength(20);
  });

  it('respects a custom limit option', async () => {
    const rows = Array.from({ length: 5 }, (_, index) => ({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, index + 1),
    }));
    for (const row of rows) {
      await insertEvent(row);
    }

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      'tenant-1',
      { limit: 2 },
    );

    expect(result).toHaveLength(2);
  });

  it("does not leak another target's events", async () => {
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, 1),
    });
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-2',
      createdAt: new Date(2026, 0, 1),
    });
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, 1),
    });

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      'tenant-1',
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.targetId).toBe('tenant-1');
    expect(result[0]?.targetType).toBe(AUDIT_TARGET_TYPE.TENANT);
  });

  it('returns an empty array when no events exist for the target', async () => {
    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      'tenant-1',
    );

    expect(result).toEqual([]);
  });
});
