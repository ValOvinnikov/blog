import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import type { TListedAuditEvent } from '@blog/db/queries/audit-events';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

export const MOCK_AUDIT_ACTOR_EMAIL = 'audit-operator@example.com';
export const MOCK_AUDIT_EVENT_AT = new Date('2026-08-24T12:00:00.000Z');

export const mockAuditEvent = (
  overrides: Partial<TListedAuditEvent> = {},
): TListedAuditEvent => {
  return {
    id: 'event-1',
    actorId: 'user-1',
    actorAccountEmail: MOCK_AUDIT_ACTOR_EMAIL,
    action: AUDIT_ACTION.CREATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: MOCK_TENANT_ID,
    details: null,
    createdAt: MOCK_AUDIT_EVENT_AT,
    ...overrides,
  };
};
