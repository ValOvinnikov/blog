import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  SIGNUP_BLOCK_LOG,
  SIGNUP_BLOCK_REFUSAL,
} from '@platform/constants/signup-block';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_BLOCKED_ADDRESS_ENTRY_ID,
  mockBlockedIdentity,
  mockBlockedAddressIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { removeBlockedIdentityAction } from './remove-blocked-identity-action';

const {
  listBlockedIdentitiesMock,
  removeBlockedIdentityMock,
  recordAuditEventMock,
} = vi.hoisted(() => ({
  listBlockedIdentitiesMock: vi.fn(),
  removeBlockedIdentityMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin');

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

faker.seed(6107);

const MOCK_DOMAIN_ENTRY = mockBlockedIdentity();
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());

describe(removeBlockedIdentityAction, () => {
  beforeEach(() => {
    listBlockedIdentitiesMock
      .mockReset()
      .mockResolvedValue(
        okResult([MOCK_DOMAIN_ENTRY, mockBlockedAddressIdentity()]),
      );
    removeBlockedIdentityMock.mockReset().mockResolvedValue(okResult());
    recordAuditEventMock.mockReset();
  });

  it('rejects a caller who is not a super admin', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(() => {
      notFound();
    });

    await expect(
      removeBlockedIdentityAction(MOCK_DOMAIN_ENTRY.id),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(removeBlockedIdentityMock).not.toHaveBeenCalled();
  });

  it('removes a domain entry and audits it with the domain', async () => {
    const result = await removeBlockedIdentityAction(MOCK_DOMAIN_ENTRY.id);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(removeBlockedIdentityMock).toHaveBeenCalledWith(
      MOCK_DOMAIN_ENTRY.id,
    );
    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_REMOVED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: MOCK_DOMAIN_ENTRY.id,
      details: {
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        domain: MOCK_DOMAIN_ENTRY.value,
      },
    });
  });

  it('audits a removed address entry without its hash', async () => {
    await removeBlockedIdentityAction(MOCK_BLOCKED_ADDRESS_ENTRY_ID);

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SIGNUP_BLOCK_REMOVED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: MOCK_BLOCKED_ADDRESS_ENTRY_ID,
      details: { kind: BLOCKED_IDENTITY_KIND.ADDRESS },
    });
  });

  it('refuses an entry that is not on the list and records nothing', async () => {
    const result = await removeBlockedIdentityAction(faker.string.uuid());

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

    const result = await removeBlockedIdentityAction(MOCK_DOMAIN_ENTRY.id);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGNUP_BLOCK_REFUSAL.ENTRY_NOT_FOUND,
    });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a server error without an audit event when the delete throws', async () => {
    removeBlockedIdentityMock.mockRejectedValue(MOCK_DB_ERROR);

    const result = await removeBlockedIdentityAction(MOCK_DOMAIN_ENTRY.id);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(SIGNUP_BLOCK_LOG.REMOVE_FAILED, {
      error: MOCK_DB_ERROR,
    });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});
