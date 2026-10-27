import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  WORKER_AUDIT_ACTOR_ID,
} from '@blog/config/constants';
import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import {
  MOCK_OPERATOR_EMAIL,
  insertTestAuditEvent,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import {
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { faker } from '@faker-js/faker';

import {
  listAuditEventsForTarget,
  type TListAuditEventsForTargetOptions,
} from './list-audit-events-for-target';

faker.seed(602104);

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();
const fallbackListener = usePersonalDataFallbackListener();

const MOCK_TARGET_ID = faker.string.uuid();
const MOCK_FIRST_DAY = new Date(2026, 0, 1);

function dayOfJanuary(day: number): Date {
  return new Date(2026, 0, day);
}

function insertEvent(
  overrides: Partial<typeof schema.auditEvents.$inferInsert> = {},
): Promise<TAuditEvent> {
  return insertTestAuditEvent(db(), {
    action: AUDIT_ACTION.DEPROVISIONED,
    targetId: MOCK_TARGET_ID,
    createdAt: MOCK_FIRST_DAY,
    ...overrides,
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
  await db().delete(schema.users);
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

  it("returns the actor's account email, read from the encrypted column", async () => {
    const { id } = await insertTestUser(db(), {
      email: faker.internet.email(),
      emailEncrypted: encryptPersonalValue(MOCK_OPERATOR_EMAIL),
    });
    await insertEvent({ actorId: id });

    const [event] = await listTargetEvents();

    expect(event?.actorAccountEmail).toBe(MOCK_OPERATOR_EMAIL);
  });

  it('reads an account not yet backfilled from its plain email, and reports it', async () => {
    const { id } = await insertTestUser(db(), { email: MOCK_OPERATOR_EMAIL });
    await insertEvent({ actorId: id });

    const [event] = await listTargetEvents();

    expect(event?.actorAccountEmail).toBe(MOCK_OPERATOR_EMAIL);
    expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
      owner: PERSONAL_DATA_OWNER.USER,
      reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
    });
  });

  it.each([
    ['a deleted account', faker.string.uuid()],
    ['a system actor', WORKER_AUDIT_ACTOR_ID],
  ])(
    'returns a null account email, and reports nothing, for %s',
    async (_, actorId) => {
      await insertEvent({ actorId });

      const [event] = await listTargetEvents();

      expect(event?.actorAccountEmail).toBeNull();
      expect(fallbackListener).not.toHaveBeenCalled();
    },
  );

  it('returns an empty array when no events exist for the target', async () => {
    const result = await listTargetEvents();

    expect(result).toEqual([]);
  });
});
