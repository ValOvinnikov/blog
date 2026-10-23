import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';

export const MOCK_AUDIT_ACTOR_EMAIL = 'audit-operator@example.com';
export const MOCK_AUDIT_EVENT_AT = new Date('2026-08-24T12:00:00.000Z');

export const makeAuditEvent = (
  overrides: Partial<TAuditEvent> = {},
): TAuditEvent => {
  return {
    id: 'event-1',
    actorId: 'user-1',
    actorEmail: MOCK_AUDIT_ACTOR_EMAIL,
    action: AUDIT_ACTION.CREATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: TENANT_ID,
    details: null,
    createdAt: MOCK_AUDIT_EVENT_AT,
    ...overrides,
  };
};
