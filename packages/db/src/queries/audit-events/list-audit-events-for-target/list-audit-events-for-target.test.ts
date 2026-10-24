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

import {
  listAuditEventsForTarget,
  type TListAuditEventsForTargetOptions,
} from './list-audit-events-for-target';

faker.seed(5783);

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const MOCK_TARGET_ID = faker.string.uuid();
const MOCK_FIRST_DAY = new Date(2026, 0, 1);

function dayOfJanuary(day: number): Date {
  return new Date(2026, 0, day);
}

async function insertEvent(
  overrides: {
    targetType?: TAuditTargetType;
    targetId?: string;
    createdAt?: Date;
    action?: TAuditAction;
  } = {},
): Promise<void> {
  await db()
    .insert(schema.auditEvents)
    .values({
      actorId: faker.string.uuid(),
      actorEmail: MOCK_OPERATOR_EMAIL,
      action: overrides.action ?? AUDIT_ACTION.DEPROVISIONED,
      targetType: overrides.targetType ?? AUDIT_TARGET_TYPE.TENANT,
      targetId: overrides.targetId ?? MOCK_TARGET_ID,
      createdAt: overrides.createdAt ?? MOCK_FIRST_DAY,
    });
}

async function insertDailyEvents(count: number): Promise<void> {
  for (let day = 1; day <= count; day += 1) {
    await insertEvent({ createdAt: dayOfJanuary(day) });
  }
}

function listTargetEvents(
  options?: TListAuditEventsForTargetOptions,
): ReturnType<typeof listAuditEventsForTarget> {
  return listAuditEventsForTarget(
    AUDIT_TARGET_TYPE.TENANT,
    MOCK_TARGET_ID,
    options,
  );
}

afterEach(async () => {
  await db().delete(schema.auditEvents);
});

describe(listAuditEventsForTarget, () => {
  it('returns events for the target ordered newest-first', async () => {
    await insertEvent({
      createdAt: dayOfJanuary(1),
      action: AUDIT_ACTION.CREATED,
    });
    await insertEvent({
      createdAt: dayOfJanuary(3),
      action: AUDIT_ACTION.DEPROVISIONED,
    });
    await insertEvent({
      createdAt: dayOfJanuary(2),
      action: AUDIT_ACTION.SETTINGS_UPDATED,
    });

    const result = await listTargetEvents();

    expect(result.map((event) => event.action)).toEqual([
      AUDIT_ACTION.DEPROVISIONED,
      AUDIT_ACTION.SETTINGS_UPDATED,
      AUDIT_ACTION.CREATED,
    ]);
  });

  it('defaults to a limit of 20 events', async () => {
    await insertDailyEvents(25);

    const result = await listTargetEvents();

    expect(result).toHaveLength(20);
  });

  it('respects a custom limit option', async () => {
    await insertDailyEvents(5);

    const result = await listTargetEvents({ limit: 2 });

    expect(result).toHaveLength(2);
  });

  it('skips the offset number of newest events', async () => {
    await insertDailyEvents(3);

    const result = await listTargetEvents({ limit: 2, offset: 2 });

    expect(result.map((event) => event.createdAt)).toEqual([MOCK_FIRST_DAY]);
  });

  it('breaks a tie on the same timestamp by id, so paging neither repeats nor skips', async () => {
    await insertEvent();
    await insertEvent();
    const all = await listTargetEvents();
    const idsNewestFirst = all
      .map((event) => event.id)
      .sort()
      .reverse();

    const [first] = await listTargetEvents({ limit: 1 });
    const [second] = await listTargetEvents({ limit: 1, offset: 1 });

    expect([first?.id, second?.id]).toEqual(idsNewestFirst);
  });

  it('treats a negative offset as the first page', async () => {
    await insertEvent();

    const result = await listTargetEvents({ offset: -25 });

    expect(result).toHaveLength(1);
  });

  it("does not leak another target's events", async () => {
    await insertEvent();
    await insertEvent({ targetId: faker.string.uuid() });
    await insertEvent({ targetType: AUDIT_TARGET_TYPE.SITE_CONFIG });

    const result = await listTargetEvents();

    expect(result).toHaveLength(1);
    expect(result[0]?.targetId).toBe(MOCK_TARGET_ID);
    expect(result[0]?.targetType).toBe(AUDIT_TARGET_TYPE.TENANT);
  });

  it('returns an empty array when no events exist for the target', async () => {
    const result = await listTargetEvents();

    expect(result).toEqual([]);
  });
});
