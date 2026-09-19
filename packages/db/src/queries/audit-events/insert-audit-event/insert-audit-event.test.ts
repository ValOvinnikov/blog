import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { insertAuditEvent } from './insert-audit-event';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.auditEvents);
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

    const [row] = await db()
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

    const rows = await db()
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.targetId, 'tenant-789'));
    expect(rows).toHaveLength(2);
  });
});
