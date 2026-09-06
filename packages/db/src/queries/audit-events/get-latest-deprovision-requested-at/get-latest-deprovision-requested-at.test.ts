import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getLatestDeprovisionRequestedAt } from './get-latest-deprovision-requested-at';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertEvent(overrides: {
  targetId: string;
  createdAt: Date;
  action?: (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
}): Promise<void> {
  await db.insert(schema.auditEvents).values({
    actorId: 'admin-1',
    actorEmail: 'admin-1@example.com',
    action: overrides.action ?? AUDIT_ACTION.DEPROVISION_REQUESTED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: overrides.targetId,
    createdAt: overrides.createdAt,
  });
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.auditEvents);
});

describe(getLatestDeprovisionRequestedAt, () => {
  it('returns the most recent request timestamp when several exist', async () => {
    await insertEvent({
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, 1),
    });
    const latest = new Date(2026, 0, 3);
    await insertEvent({ targetId: 'tenant-1', createdAt: latest });
    await insertEvent({
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, 2),
    });

    const result = await getLatestDeprovisionRequestedAt('tenant-1');

    expect(result).toEqual(latest);
  });

  it('returns undefined when no request event exists for the tenant', async () => {
    const result = await getLatestDeprovisionRequestedAt('tenant-1');

    expect(result).toBeUndefined();
  });

  it('ignores events for a different tenant', async () => {
    await insertEvent({ targetId: 'tenant-2', createdAt: new Date(2026, 0, 1) });

    const result = await getLatestDeprovisionRequestedAt('tenant-1');

    expect(result).toBeUndefined();
  });

  it('ignores other action types for the same tenant', async () => {
    await insertEvent({
      targetId: 'tenant-1',
      createdAt: new Date(2026, 0, 1),
      action: AUDIT_ACTION.DEPROVISIONED,
    });

    const result = await getLatestDeprovisionRequestedAt('tenant-1');

    expect(result).toBeUndefined();
  });
});
