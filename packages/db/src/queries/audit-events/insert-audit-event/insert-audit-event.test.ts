import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { insertAuditEvent } from './insert-audit-event';

faker.seed(602103);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_ACTOR_ID = faker.string.uuid();
const MOCK_TENANT_ID = faker.string.uuid();
const MOCK_REPEATED_TARGET_ID = faker.string.uuid();
const MOCK_DETAILS = {
  previousStatus: faker.word.noun(),
  reason: faker.lorem.sentence(),
};

afterEach(async () => {
  await db().delete(schema.auditEvents);
});

describe(insertAuditEvent, () => {
  it('returns the actor, action, target and details exactly as given', async () => {
    const { actorId, action, targetType, targetId, details } =
      await insertAuditEvent({
        actorId: MOCK_ACTOR_ID,
        action: AUDIT_ACTION.DEPROVISIONED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        details: MOCK_DETAILS,
      });

    expect(actorId).toBe(MOCK_ACTOR_ID);
    expect(action).toBe(AUDIT_ACTION.DEPROVISIONED);
    expect(targetType).toBe(AUDIT_TARGET_TYPE.TENANT);
    expect(targetId).toBe(MOCK_TENANT_ID);
    expect(details).toEqual(MOCK_DETAILS);
  });

  it('persists the returned event', async () => {
    const event = await insertAuditEvent({
      actorId: MOCK_ACTOR_ID,
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: MOCK_DETAILS,
    });

    const [row] = await db()
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.id, event.id));

    expect(row).toEqual(event);
  });

  it('leaves details NULL when omitted', async () => {
    const { details } = await insertAuditEvent({
      actorId: MOCK_ACTOR_ID,
      action: AUDIT_ACTION.CREATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
    });

    expect(details).toBeNull();
  });

  it('persists a distinct row per call, even for the same action and target', async () => {
    const input = {
      actorId: MOCK_ACTOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_REPEATED_TARGET_ID,
    };
    await insertAuditEvent(input);
    await insertAuditEvent(input);

    const rows = await db()
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.targetId, MOCK_REPEATED_TARGET_ID));

    expect(rows).toHaveLength(2);
  });
});
