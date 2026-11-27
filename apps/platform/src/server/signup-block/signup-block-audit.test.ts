import {
  firstRecordedAuditEvent,
  recordedAuditEvents,
} from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_ADDRESS_HASH,
  mockBlockedIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@shinefold/config';
import { BLOCKED_IDENTITY_KIND } from '@shinefold/db/constants';

import { recordSignupBlockAdded } from './signup-block-audit';

const { recordAuditEventMock } = vi.hoisted(() => ({
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {},
}));

describe(recordSignupBlockAdded, () => {
  const entry = mockBlockedIdentity({
    kind: BLOCKED_IDENTITY_KIND.ADDRESS,
    value: MOCK_BLOCKED_ADDRESS_HASH,
  });

  beforeEach(() => {
    recordAuditEventMock.mockReset();
  });

  it('audits an address entry without the address or its hash', async () => {
    await recordSignupBlockAdded(entry, MOCK_BLOCK_REASON);

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: entry.id,
      details: {
        kind: BLOCKED_IDENTITY_KIND.ADDRESS,
        reason: MOCK_BLOCK_REASON,
      },
    });
  });

  it('also audits a block added for a tenant against that tenant, without the address', async () => {
    await recordSignupBlockAdded(entry, MOCK_BLOCK_REASON, MOCK_TENANT_ID);

    expect(recordedAuditEvents(recordAuditEventMock)).toEqual([
      {
        action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
        targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
        targetId: entry.id,
        details: {
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          reason: MOCK_BLOCK_REASON,
          tenantId: MOCK_TENANT_ID,
        },
      },
      {
        action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        details: {
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          reason: MOCK_BLOCK_REASON,
        },
      },
    ]);
  });
});
