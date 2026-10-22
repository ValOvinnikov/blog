import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import type { TBlockedSignupIdentity } from '@blog/db/schema/blocked-signup-identities';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  BLOCK_REASON,
  BLOCKED_ADDRESS_HASH,
  BLOCKED_OWNER_EMAIL,
  makeBlockedIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { addSignupBlock } from './add-signup-block';

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
const NOW = new Date(Date.UTC(2026, 9, 21, 9));

const newEntry = (overrides: Partial<TBlockedSignupIdentity> = {}) =>
  makeBlockedIdentity({
    createdByAdminId: ADMIN.id,
    createdAt: NOW,
    ...overrides,
  });

describe(addSignupBlock, () => {
  beforeEach(() => {
    addBlockedIdentityMock.mockReset();
    recordAuditEventMock.mockReset();
  });

  it('adds a domain entry as the admin and audits it with the domain', async () => {
    const entry = newEntry();
    addBlockedIdentityMock.mockResolvedValue({ ok: true, data: entry });

    const result = await addSignupBlock({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: entry.value,
      reason: BLOCK_REASON,
      admin: ADMIN,
    });

    expect(result).toEqual({ ok: true, data: entry });
    expect(addBlockedIdentityMock).toHaveBeenCalledWith({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: entry.value,
      reason: BLOCK_REASON,
      createdByAdminId: ADMIN.id,
    });
    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: entry.id,
      details: {
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        reason: BLOCK_REASON,
        domain: entry.value,
      },
    });
  });

  it('audits an address entry without the address or its hash', async () => {
    const entry = newEntry({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      value: BLOCKED_ADDRESS_HASH,
    });
    addBlockedIdentityMock.mockResolvedValue({ ok: true, data: entry });

    await addSignupBlock({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: BLOCKED_OWNER_EMAIL,
      reason: BLOCK_REASON,
      admin: ADMIN,
    });

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: entry.id,
      details: { kind: BLOCKED_IDENTITY_KIND.ADDRESS, reason: BLOCK_REASON },
    });
  });

  it('records no audit event when the entry could not be stored', async () => {
    const failure = { ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN };
    addBlockedIdentityMock.mockResolvedValue(failure);

    const result = await addSignupBlock({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: BLOCKED_OWNER_EMAIL,
      reason: BLOCK_REASON,
      admin: ADMIN,
    });

    expect(result).toEqual(failure);
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it.each([
    ['an entry with another reason', { reason: `${BLOCK_REASON} earlier` }],
    ['an entry added by another admin', { createdByAdminId: null }],
  ])(
    'records no audit event for %s already on the list',
    async (_, existing) => {
      const entry = newEntry(existing);
      addBlockedIdentityMock.mockResolvedValue({ ok: true, data: entry });

      const result = await addSignupBlock({
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        identity: entry.value,
        reason: BLOCK_REASON,
        admin: ADMIN,
      });

      expect(result).toEqual({ ok: true, data: entry });
      expect(recordAuditEventMock).not.toHaveBeenCalled();
    },
  );
});
