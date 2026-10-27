import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_ADDRESS_HASH,
  MOCK_BLOCKED_DOMAIN,
  mockBlockedIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { addSignupBlock, recordSignupBlockAdded } from './add-signup-block';

const { addBlockedIdentityMock, recordAuditEventMock } = vi.hoisted(() => ({
  addBlockedIdentityMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    blockedSignupIdentities: { addBlockedIdentity: addBlockedIdentityMock },
  },
}));

const MOCK_ADMIN = mockAdmin();
const MOCK_DOMAIN_BLOCK = {
  kind: BLOCKED_IDENTITY_KIND.DOMAIN,
  identity: MOCK_BLOCKED_DOMAIN,
  reason: MOCK_BLOCK_REASON,
  admin: MOCK_ADMIN,
};

const outcomeOf = (created: boolean) =>
  okResult({ entry: mockBlockedIdentity(), created });

describe(addSignupBlock, () => {
  beforeEach(() => {
    addBlockedIdentityMock.mockReset();
    recordAuditEventMock.mockReset();
  });

  it('adds a domain entry as the admin and audits it once with the domain', async () => {
    const created = outcomeOf(true);
    addBlockedIdentityMock.mockResolvedValue(created);

    const result = await addSignupBlock(MOCK_DOMAIN_BLOCK);

    expect(result).toEqual(created);
    expect(addBlockedIdentityMock).toHaveBeenCalledWith({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: MOCK_BLOCKED_DOMAIN,
      reason: MOCK_BLOCK_REASON,
      createdByAdminId: MOCK_ADMIN.id,
    });
    expect(recordAuditEventMock).toHaveBeenCalledTimes(1);
    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: created.data.entry.id,
      details: {
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        reason: MOCK_BLOCK_REASON,
        domain: MOCK_BLOCKED_DOMAIN,
      },
    });
  });

  it('records no audit event when the entry was already on the list', async () => {
    const existing = outcomeOf(false);
    addBlockedIdentityMock.mockResolvedValue(existing);

    const result = await addSignupBlock(MOCK_DOMAIN_BLOCK);

    expect(result).toEqual(existing);
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('records no audit event when the entry could not be stored', async () => {
    const failure = errorResult(ERROR_CODE.DB_INVALID_DOMAIN);
    addBlockedIdentityMock.mockResolvedValue(failure);

    const result = await addSignupBlock(MOCK_DOMAIN_BLOCK);

    expect(result).toEqual(failure);
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});

describe(recordSignupBlockAdded, () => {
  beforeEach(() => {
    recordAuditEventMock.mockReset();
  });

  it('audits an address entry without the address or its hash', async () => {
    const entry = mockBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      value: MOCK_BLOCKED_ADDRESS_HASH,
    });

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
});
