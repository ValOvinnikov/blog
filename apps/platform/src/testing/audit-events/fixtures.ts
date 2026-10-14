import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';

export const makeAuditEvent = (
  overrides: Partial<TAuditEvent> = {},
): TAuditEvent => {
  return {
    id: 'event-1',
    actorId: 'user-1',
    actorEmail: 'vo@valstack.dev',
    action: AUDIT_ACTION.CREATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: 'tenant-1',
    details: null,
    createdAt: new Date('2026-08-24T12:00:00.000Z'),
    ...overrides,
  };
};
