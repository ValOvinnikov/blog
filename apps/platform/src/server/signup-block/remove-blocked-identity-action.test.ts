import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { SIGNUP_BLOCK_REFUSAL } from '@platform/constants/signup-block';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  BLOCKED_ADDRESS_ENTRY_ID,
  BLOCKED_ADDRESS_HASH,
  makeBlockedIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

import { removeBlockedIdentityAction } from './remove-blocked-identity-action';

const {
  requireSuperAdminMock,
  listBlockedIdentitiesMock,
  removeBlockedIdentityMock,
  recordAuditEventMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  listBlockedIdentitiesMock: vi.fn(),
  removeBlockedIdentityMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    blockedSignupIdentities: {
      listBlockedIdentities: listBlockedIdentitiesMock,
      removeBlockedIdentity: removeBlockedIdentityMock,
    },
  },
}));

const DOMAIN_ENTRY = makeBlockedIdentity();
const ADDRESS_ENTRY = makeBlockedIdentity({
  id: BLOCKED_ADDRESS_ENTRY_ID,
  kind: BLOCKED_IDENTITY_KIND.ADDRESS,
  value: BLOCKED_ADDRESS_HASH,
});

describe(removeBlockedIdentityAction, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(makeAdmin());
    listBlockedIdentitiesMock
      .mockReset()
      .mockResolvedValue(okResult([DOMAIN_ENTRY, ADDRESS_ENTRY]));
    removeBlockedIdentityMock
      .mockReset()
      .mockResolvedValue(okResult(undefined));
    recordAuditEventMock.mockReset();
  });

  it('rejects a caller who is not a super admin before touching the list', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(removeBlockedIdentityAction(DOMAIN_ENTRY.id)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(removeBlockedIdentityMock).not.toHaveBeenCalled();
  });

  it('removes a domain entry and audits it with the domain', async () => {
    const result = await removeBlockedIdentityAction(DOMAIN_ENTRY.id);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(removeBlockedIdentityMock).toHaveBeenCalledWith(DOMAIN_ENTRY.id);
    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_REMOVED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: DOMAIN_ENTRY.id,
      details: {
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        domain: DOMAIN_ENTRY.value,
      },
    });
  });

  it('audits a removed address entry without its hash', async () => {
    await removeBlockedIdentityAction(ADDRESS_ENTRY.id);

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_REMOVED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: ADDRESS_ENTRY.id,
      details: { kind: BLOCKED_IDENTITY_KIND.ADDRESS },
    });
  });

  it('refuses an entry that is not on the list and records nothing', async () => {
    const result = await removeBlockedIdentityAction(`${DOMAIN_ENTRY.id}-gone`);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGNUP_BLOCK_REFUSAL.ENTRY_NOT_FOUND,
    });
    expect(removeBlockedIdentityMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('refuses an entry removed by someone else meanwhile and records nothing', async () => {
    removeBlockedIdentityMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await removeBlockedIdentityAction(DOMAIN_ENTRY.id);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGNUP_BLOCK_REFUSAL.ENTRY_NOT_FOUND,
    });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a server error without an audit event when the delete throws', async () => {
    removeBlockedIdentityMock.mockRejectedValue(new Error('db down'));

    const result = await removeBlockedIdentityAction(DOMAIN_ENTRY.id);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});
