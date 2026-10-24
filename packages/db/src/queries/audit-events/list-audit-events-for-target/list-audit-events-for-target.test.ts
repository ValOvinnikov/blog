import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TAuditAction,
  type TAuditTargetType,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { MOCK_OPERATOR_EMAIL } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { listAuditEventsForTarget } from './list-audit-events-for-target';

faker.seed(5783);

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const MOCK_TARGET_ID = faker.string.uuid();

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
      actorId: faker.string.uuid(),
      actorEmail: overrides.actorEmail ?? MOCK_OPERATOR_EMAIL,
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
      targetId: MOCK_TARGET_ID,
      createdAt: new Date(2026, 0, 1),
      action: AUDIT_ACTION.CREATED,
    });
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TARGET_ID,
      createdAt: new Date(2026, 0, 3),
      action: AUDIT_ACTION.DEPROVISIONED,
    });
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TARGET_ID,
      createdAt: new Date(2026, 0, 2),
      action: AUDIT_ACTION.SETTINGS_UPDATED,
    });

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TARGET_ID,
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
      targetId: MOCK_TARGET_ID,
      createdAt: new Date(2026, 0, index + 1),
    }));
    for (const row of rows) {
      await insertEvent(row);
    }

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TARGET_ID,
    );

    expect(result).toHaveLength(20);
  });

  it('respects a custom limit option', async () => {
    const rows = Array.from({ length: 5 }, (_, index) => ({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TARGET_ID,
      createdAt: new Date(2026, 0, index + 1),
    }));
    for (const row of rows) {
      await insertEvent(row);
    }

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TARGET_ID,
      { limit: 2 },
    );

    expect(result).toHaveLength(2);
  });

  it('skips the offset number of newest events', async () => {
    const rows = Array.from({ length: 3 }, (_, index) => ({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TARGET_ID,
      createdAt: new Date(2026, 0, index + 1),
    }));
    for (const row of rows) {
      await insertEvent(row);
    }

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TARGET_ID,
      { limit: 2, offset: 2 },
    );

    expect(result.map((event) => event.createdAt)).toEqual([
      new Date(2026, 0, 1),
    ]);
  });

  it("does not leak another target's events", async () => {
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TARGET_ID,
      createdAt: new Date(2026, 0, 1),
    });
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: faker.string.uuid(),
      createdAt: new Date(2026, 0, 1),
    });
    await insertEvent({
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TARGET_ID,
      createdAt: new Date(2026, 0, 1),
    });

    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TARGET_ID,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.targetId).toBe(MOCK_TARGET_ID);
    expect(result[0]?.targetType).toBe(AUDIT_TARGET_TYPE.TENANT);
  });

  it('returns an empty array when no events exist for the target', async () => {
    const result = await listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TARGET_ID,
    );

    expect(result).toEqual([]);
  });
});
