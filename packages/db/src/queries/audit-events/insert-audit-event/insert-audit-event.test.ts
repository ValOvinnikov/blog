import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { insertAuditEvent } from './insert-audit-event';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_ACTOR_ID = 'admin-1';
const MOCK_TENANT_ID = 'tenant-123';
const MOCK_REPEATED_TARGET_ID = 'tenant-789';
const MOCK_DETAILS = {
  previousStatus: 'active',
  reason: 'customer offboarding',
};

afterEach(async () => {
  await db().delete(schema.auditEvents);
});

describe(insertAuditEvent, () => {
  it('writes the actor id, action, target, and details exactly as given', async () => {
    const event = await insertAuditEvent({
      actorId: MOCK_ACTOR_ID,
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: MOCK_DETAILS,
    });

    expect(event.actorId).toBe(MOCK_ACTOR_ID);
    expect(event.action).toBe(AUDIT_ACTION.DEPROVISIONED);
    expect(event.targetType).toBe(AUDIT_TARGET_TYPE.TENANT);
    expect(event.targetId).toBe(MOCK_TENANT_ID);
    expect(event.details).toEqual(MOCK_DETAILS);
    expect(event.createdAt).toBeInstanceOf(Date);

    const [row] = await db()
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.id, event.id));
    expect(row?.action).toBe(AUDIT_ACTION.DEPROVISIONED);
    expect(row?.targetId).toBe(MOCK_TENANT_ID);
    expect(row?.details).toEqual(MOCK_DETAILS);
  });

  it('leaves details NULL when omitted, rather than an empty-object sentinel', async () => {
    const event = await insertAuditEvent({
      actorId: MOCK_ACTOR_ID,
      action: AUDIT_ACTION.CREATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-456',
    });

    expect(event.details).toBeNull();
  });

  it('persists a distinct row per call, even for the same action and target', async () => {
    await insertAuditEvent({
      actorId: MOCK_ACTOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_REPEATED_TARGET_ID,
    });
    await insertAuditEvent({
      actorId: MOCK_ACTOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_REPEATED_TARGET_ID,
    });

    const rows = await db()
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.targetId, MOCK_REPEATED_TARGET_ID));
    expect(rows).toHaveLength(2);
  });
});
