import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { insertAuditEvent } from './insert-audit-event';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query this function builds still runs as real SQL (see
// src/testing/create-test-db.ts), so the foreign-key/`set null` behaviour
// under test is the real Postgres constraint, not a mocked stand-in.
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertUser(id: string): Promise<void> {
  await db.insert(schema.users).values({ id });
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.auditEvents);
  await db.delete(schema.users);
});

describe(insertAuditEvent, () => {
  it('writes the actor, action, target, and details exactly as given', async () => {
    await insertUser('admin-1');

    const event = await insertAuditEvent({
      actorId: 'admin-1',
      action: 'tenants.archived',
      targetType: 'tenant',
      targetId: 'tenant-123',
      details: { previousStatus: 'active', reason: 'customer offboarding' },
    });

    expect(event.actorId).toBe('admin-1');
    expect(event.action).toBe('tenants.archived');
    expect(event.targetType).toBe('tenant');
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
    expect(row?.action).toBe('tenants.archived');
    expect(row?.targetId).toBe('tenant-123');
    expect(row?.details).toEqual({
      previousStatus: 'active',
      reason: 'customer offboarding',
    });
  });

  it('leaves details NULL when omitted, rather than an empty-object sentinel', async () => {
    await insertUser('admin-1');

    const event = await insertAuditEvent({
      actorId: 'admin-1',
      action: 'tenants.created',
      targetType: 'tenant',
      targetId: 'tenant-456',
    });

    expect(event.details).toBeNull();
  });

  it('persists a distinct row per call, even for the same action and target', async () => {
    await insertUser('admin-1');

    await insertAuditEvent({
      actorId: 'admin-1',
      action: 'tenants.updated',
      targetType: 'tenant',
      targetId: 'tenant-789',
    });
    await insertAuditEvent({
      actorId: 'admin-1',
      action: 'tenants.updated',
      targetType: 'tenant',
      targetId: 'tenant-789',
    });

    const rows = await db
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.targetId, 'tenant-789'));
    expect(rows).toHaveLength(2);
  });

  it('rejects an audit event for an actor that does not exist', async () => {
    await expect(
      insertAuditEvent({
        actorId: 'missing-user',
        action: 'tenants.archived',
        targetType: 'tenant',
        targetId: 'tenant-123',
      }),
    ).rejects.toThrow();
  });
});

describe('foreign-key set-null', () => {
  it('anonymizes actorId, without deleting the row, when the actor is deleted', async () => {
    await insertUser('admin-1');
    const event = await insertAuditEvent({
      actorId: 'admin-1',
      action: 'admins.granted',
      targetType: 'admin',
      targetId: 'admin-row-1',
    });

    await db.delete(schema.users).where(eq(schema.users.id, 'admin-1'));

    const [row] = await db
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.id, event.id));
    expect(row).toBeDefined();
    expect(row?.actorId).toBeNull();
    expect(row?.action).toBe('admins.granted');
  });
});
