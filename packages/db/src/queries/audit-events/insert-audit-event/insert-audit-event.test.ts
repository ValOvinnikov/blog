import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { insertAuditEvent } from './insert-audit-event';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query this function builds still runs as real SQL (see
// src/testing/create-test-db.ts), so the NOT NULL constraints under test
// are the real Postgres constraints, not a mocked stand-in.
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.auditEvents);
});

describe(insertAuditEvent, () => {
  it('writes the actor, action, target, and details exactly as given', async () => {
    const event = await insertAuditEvent({
      actorId: 'admin-1',
      actorEmail: 'admin-1@example.com',
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-123',
      details: { previousStatus: 'active', reason: 'customer offboarding' },
    });

    expect(event.actorId).toBe('admin-1');
    expect(event.actorEmail).toBe('admin-1@example.com');
    expect(event.action).toBe(AUDIT_ACTION.DEPROVISIONED);
    expect(event.targetType).toBe(AUDIT_TARGET_TYPE.TENANT);
    expect(event.targetId).toBe('tenant-123');
    expect(event.details).toEqual({
      previousStatus: 'active',
      reason: 'customer offboarding',
    });
    expect(event.createdAt).toBeInstanceOf(Date);

    const [row] = await db
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.id, event.id));
    expect(row?.action).toBe(AUDIT_ACTION.DEPROVISIONED);
    expect(row?.targetId).toBe('tenant-123');
    expect(row?.details).toEqual({
      previousStatus: 'active',
      reason: 'customer offboarding',
    });
  });

  it('leaves details NULL when omitted, rather than an empty-object sentinel', async () => {
    const event = await insertAuditEvent({
      actorId: 'admin-1',
      actorEmail: 'admin-1@example.com',
      action: AUDIT_ACTION.CREATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-456',
    });

    expect(event.details).toBeNull();
  });

  it('persists a distinct row per call, even for the same action and target', async () => {
    await insertAuditEvent({
      actorId: 'admin-1',
      actorEmail: 'admin-1@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-789',
    });
    await insertAuditEvent({
      actorId: 'admin-1',
      actorEmail: 'admin-1@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-789',
    });

    const rows = await db
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.targetId, 'tenant-789'));
    expect(rows).toHaveLength(2);
  });
});
