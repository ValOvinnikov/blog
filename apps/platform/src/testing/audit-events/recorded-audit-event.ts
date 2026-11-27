import type { TRecordAuditEventInput } from '@platform/server/audit/record-audit-event';
import { omit } from 'remeda';
import type { Mock } from 'vitest';

type TRecordedAuditEvent = Omit<TRecordAuditEventInput, 'logEvent'>;
type TRecordAuditEventMock = Mock<(input: TRecordAuditEventInput) => unknown>;

export const recordedAuditEvents = (
  recordAuditEventMock: TRecordAuditEventMock,
): TRecordedAuditEvent[] =>
  recordAuditEventMock.mock.calls.map(([event]) => omit(event, ['logEvent']));

export const firstRecordedAuditEvent = (
  recordAuditEventMock: TRecordAuditEventMock,
): TRecordedAuditEvent => {
  const [event] = recordedAuditEvents(recordAuditEventMock);

  return event ?? ({} as TRecordedAuditEvent);
};
