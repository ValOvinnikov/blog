import type { TRecordAuditEventInput } from '@platform/server/audit/record-audit-event';
import type { Mock } from 'vitest';

type TRecordedAuditEvent = Omit<TRecordAuditEventInput, 'logEvent'>;

export const firstRecordedAuditEvent = (
  recordAuditEventMock: Mock<(input: TRecordAuditEventInput) => unknown>,
): TRecordedAuditEvent => {
  const [input] = recordAuditEventMock.mock.calls.map(([event]) => event);

  return Object.fromEntries(
    Object.entries(input ?? {}).filter(([key]) => key !== 'logEvent'),
  ) as TRecordedAuditEvent;
};
