import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  BLOCK_REASON,
  BLOCKED_ADDRESS_HASH,
  BLOCKED_DOMAIN,
  makeBlockedIdentity,
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

const ADMIN = makeAdmin();
const DOMAIN_BLOCK = {
  kind: BLOCKED_IDENTITY_KIND.DOMAIN,
  identity: BLOCKED_DOMAIN,
  reason: BLOCK_REASON,
  admin: ADMIN,
};

const outcomeOf = (created: boolean) => ({
  ok: true,
  data: { entry: makeBlockedIdentity(), created },
});

describe(addSignupBlock, () => {
  beforeEach(() => {
    addBlockedIdentityMock.mockReset();
    recordAuditEventMock.mockReset();
  });

  it('adds a domain entry as the admin and audits it once with the domain', async () => {
    const created = outcomeOf(true);
    addBlockedIdentityMock.mockResolvedValue(created);

    const result = await addSignupBlock(DOMAIN_BLOCK);

    expect(result).toEqual(created);
    expect(addBlockedIdentityMock).toHaveBeenCalledWith({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: BLOCKED_DOMAIN,
      reason: BLOCK_REASON,
      createdByAdminId: ADMIN.id,
    });
    expect(recordAuditEventMock).toHaveBeenCalledTimes(1);
    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: created.data.entry.id,
      details: {
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        reason: BLOCK_REASON,
        domain: BLOCKED_DOMAIN,
      },
    });
  });

  it('records no audit event when the entry was already on the list', async () => {
    const existing = outcomeOf(false);
    addBlockedIdentityMock.mockResolvedValue(existing);

    const result = await addSignupBlock(DOMAIN_BLOCK);

    expect(result).toEqual(existing);
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('records no audit event when the entry could not be stored', async () => {
    const failure = { ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN };
    addBlockedIdentityMock.mockResolvedValue(failure);

    const result = await addSignupBlock(DOMAIN_BLOCK);

    expect(result).toEqual(failure);
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});

describe(recordSignupBlockAdded, () => {
  beforeEach(() => {
    recordAuditEventMock.mockReset();
  });

  it('audits an address entry without the address or its hash', async () => {
    const entry = makeBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      value: BLOCKED_ADDRESS_HASH,
    });

    await recordSignupBlockAdded(entry, BLOCK_REASON);

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: entry.id,
      details: { kind: BLOCKED_IDENTITY_KIND.ADDRESS, reason: BLOCK_REASON },
    });
  });
});
