import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND, TENANT_STATUS } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  BLOCK_REASON,
  BLOCKED_ADDRESS_HASH,
  BLOCKED_OWNER_EMAIL,
  makeBlockedIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

const {
  requireSuperAdminMock,
  getTenantByIdMock,
  setTenantSuspensionMock,
  getTenantOwnerEmailMock,
  saveSignupBlockMock,
  recordSignupBlockAddedMock,
  removeBlockedIdentityMock,
  recordAuditEventMock,
  revalidateSiteConfigMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  setTenantSuspensionMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
  saveSignupBlockMock: vi.fn(),
  recordSignupBlockAddedMock: vi.fn(),
  removeBlockedIdentityMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
  revalidateSiteConfigMock: vi.fn(),
}));

vi.mock('@platform/server/signup-block/add-signup-block', () => ({
  saveSignupBlock: saveSignupBlockMock,
  recordSignupBlockAdded: recordSignupBlockAddedMock,
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@platform/server/site-config/revalidate-site-config', () => ({
  revalidateSiteConfig: revalidateSiteConfigMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      setTenantSuspension: setTenantSuspensionMock,
    },
    memberships: { getTenantOwnerEmail: getTenantOwnerEmailMock },
    blockedSignupIdentities: {
      removeBlockedIdentity: removeBlockedIdentityMock,
    },
  },
}));

const ADMIN = makeAdmin();
const ENTRY = makeBlockedIdentity({
  kind: BLOCKED_IDENTITY_KIND.ADDRESS,
  value: BLOCKED_ADDRESS_HASH,
});
const OWNER_EMAIL = BLOCKED_OWNER_EMAIL;
const UNDO_FAILURE = new Error('delete failed');

const ACTIVE_TENANT = {
  id: TENANT_ID,
  name: 'Acme',
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
};

describe('tenant suspension actions', () => {
  let actions: typeof import('./tenant-suspension-actions');

  beforeEach(async () => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue(ADMIN);
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(ACTIVE_TENANT);
    setTenantSuspensionMock.mockReset();
    setTenantSuspensionMock.mockResolvedValue(okResult({}));
    getTenantOwnerEmailMock.mockReset().mockResolvedValue(OWNER_EMAIL);
    saveSignupBlockMock
      .mockReset()
      .mockResolvedValue(okResult({ entry: ENTRY, created: true }));
    recordSignupBlockAddedMock.mockReset();
    removeBlockedIdentityMock
      .mockReset()
      .mockResolvedValue(okResult(undefined));
    vi.mocked(logger.error).mockReset();
    recordAuditEventMock.mockReset();
    revalidateSiteConfigMock.mockReset();
    actions = await import('./tenant-suspension-actions');
  });

  it('requires a super-admin session before reading the tenant', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(actions.suspendTenantAction(ACTIVE_TENANT.id)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(setTenantSuspensionMock).not.toHaveBeenCalled();
  });

  it('suspends the tenant, purges its cached site and records the operator action', async () => {
    const result = await actions.suspendTenantAction(ACTIVE_TENANT.id);

    expect(setTenantSuspensionMock).toHaveBeenCalledWith(
      ACTIVE_TENANT.id,
      TENANT_STATUS.SUSPENDED,
    );
    expect(revalidateSiteConfigMock).toHaveBeenCalledWith(ACTIVE_TENANT.id);
    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SUSPENSION_APPLIED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: ACTIVE_TENANT.id,
      details: { name: ACTIVE_TENANT.name },
    });
    expect(saveSignupBlockMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('reactivates a suspended tenant and records the lifted suspension', async () => {
    getTenantByIdMock.mockResolvedValue({
      ...ACTIVE_TENANT,
      status: TENANT_STATUS.SUSPENDED,
    });

    const result = await actions.liftTenantSuspensionAction(ACTIVE_TENANT.id);

    expect(setTenantSuspensionMock).toHaveBeenCalledWith(
      ACTIVE_TENANT.id,
      TENANT_STATUS.ACTIVE,
    );
    expect(revalidateSiteConfigMock).toHaveBeenCalledWith(ACTIVE_TENANT.id);
    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.SUSPENSION_LIFTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: ACTIVE_TENANT.id,
      details: { name: ACTIVE_TENANT.name },
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses an unknown tenant', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await actions.suspendTenantAction(ACTIVE_TENANT.id);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(setTenantSuspensionMock).not.toHaveBeenCalled();
  });

  it.each([
    { status: TENANT_STATUS.ARCHIVED, deprovisionedAt: null },
    {
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: new Date('2026-08-26T00:00:00Z'),
    },
  ])(
    'refuses an archived tenant ($status, deprovisionedAt $deprovisionedAt)',
    async (archived) => {
      getTenantByIdMock.mockResolvedValue({ ...ACTIVE_TENANT, ...archived });

      const result = await actions.liftTenantSuspensionAction(ACTIVE_TENANT.id);

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ARCHIVED,
      });
      expect(setTenantSuspensionMock).not.toHaveBeenCalled();
      expect(recordAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it('refuses when the tenant is archived before the write lands', async () => {
    setTenantSuspensionMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await actions.suspendTenantAction(ACTIVE_TENANT.id);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a server error without an audit event when the write throws', async () => {
    setTenantSuspensionMock.mockRejectedValue(new Error('db down'));

    const result = await actions.suspendTenantAction(ACTIVE_TENANT.id);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  describe('when the operator also blocks the owner email', () => {
    const OWNER_BLOCK = { reason: BLOCK_REASON };
    const SAVED_BLOCK = {
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: OWNER_EMAIL,
      reason: BLOCK_REASON,
      admin: ADMIN,
    };

    it('blocks the owner address as the admin, suspends, then audits the block', async () => {
      const result = await actions.suspendTenantAction(
        ACTIVE_TENANT.id,
        OWNER_BLOCK,
      );

      expect(saveSignupBlockMock).toHaveBeenCalledWith(SAVED_BLOCK);
      expect(setTenantSuspensionMock).toHaveBeenCalledWith(
        ACTIVE_TENANT.id,
        TENANT_STATUS.SUSPENDED,
      );
      expect(recordSignupBlockAddedMock).toHaveBeenCalledWith(
        ENTRY,
        BLOCK_REASON,
      );
      expect(removeBlockedIdentityMock).not.toHaveBeenCalled();
      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    });

    it('trims the reason before storing it', async () => {
      await actions.suspendTenantAction(ACTIVE_TENANT.id, {
        reason: `  ${BLOCK_REASON}  `,
      });

      expect(saveSignupBlockMock).toHaveBeenCalledWith(SAVED_BLOCK);
    });

    it('does not audit a block that was already on the list', async () => {
      saveSignupBlockMock.mockResolvedValue(
        okResult({ entry: ENTRY, created: false }),
      );

      const result = await actions.suspendTenantAction(
        ACTIVE_TENANT.id,
        OWNER_BLOCK,
      );

      expect(recordSignupBlockAddedMock).not.toHaveBeenCalled();
      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    });

    it('rejects a blank reason without blocking or suspending', async () => {
      const result = await actions.suspendTenantAction(ACTIVE_TENANT.id, {
        reason: '   ',
      });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {},
      });
      expect(saveSignupBlockMock).not.toHaveBeenCalled();
      expect(setTenantSuspensionMock).not.toHaveBeenCalled();
    });

    it('refuses without suspending when the owner has no email on record', async () => {
      getTenantOwnerEmailMock.mockResolvedValue(undefined);

      const result = await actions.suspendTenantAction(
        ACTIVE_TENANT.id,
        OWNER_BLOCK,
      );

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN,
      });
      expect(setTenantSuspensionMock).not.toHaveBeenCalled();
      expect(recordAuditEventMock).not.toHaveBeenCalled();
    });

    it('fails without suspending when the block cannot be stored', async () => {
      saveSignupBlockMock.mockResolvedValue(
        errorResult(ERROR_CODE.DB_INVALID_EMAIL),
      );

      const result = await actions.suspendTenantAction(
        ACTIVE_TENANT.id,
        OWNER_BLOCK,
      );

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(setTenantSuspensionMock).not.toHaveBeenCalled();
      expect(recordAuditEventMock).not.toHaveBeenCalled();
    });

    it('blocks nothing for an unknown tenant', async () => {
      getTenantByIdMock.mockResolvedValue(undefined);

      await actions.suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

      expect(saveSignupBlockMock).not.toHaveBeenCalled();
    });

    describe('and the suspension fails', () => {
      it.each([
        [
          'is refused',
          () =>
            setTenantSuspensionMock.mockResolvedValue(
              errorResult(ERROR_CODE.DB_NOT_FOUND),
            ),
          { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.ARCHIVED },
        ],
        [
          'fails with an exception',
          () => setTenantSuspensionMock.mockRejectedValue(new Error('db down')),
          { outcome: ACTION_OUTCOME.SERVER_ERROR },
        ],
      ])(
        'removes the block it created and audits no add when the suspension %s',
        async (_, failSuspension, expected) => {
          failSuspension();

          const result = await actions.suspendTenantAction(
            ACTIVE_TENANT.id,
            OWNER_BLOCK,
          );

          expect(result).toEqual(expected);
          expect(removeBlockedIdentityMock).toHaveBeenCalledWith(ENTRY.id);
          expect(recordSignupBlockAddedMock).not.toHaveBeenCalled();
          expect(recordAuditEventMock).not.toHaveBeenCalled();
        },
      );

      it('keeps the block and audits it once when only the cache purge fails', async () => {
        revalidateSiteConfigMock.mockRejectedValue(new Error('cache down'));

        const result = await actions.suspendTenantAction(
          ACTIVE_TENANT.id,
          OWNER_BLOCK,
        );

        expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
        expect(removeBlockedIdentityMock).not.toHaveBeenCalled();
        expect(recordSignupBlockAddedMock).toHaveBeenCalledTimes(1);
        expect(recordSignupBlockAddedMock).toHaveBeenCalledWith(
          ENTRY,
          BLOCK_REASON,
        );
      });

      it('keeps a block that was already on the list', async () => {
        saveSignupBlockMock.mockResolvedValue(
          okResult({ entry: ENTRY, created: false }),
        );
        setTenantSuspensionMock.mockResolvedValue(
          errorResult(ERROR_CODE.DB_NOT_FOUND),
        );

        await actions.suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

        expect(removeBlockedIdentityMock).not.toHaveBeenCalled();
      });

      it.each([
        [
          'returns an error',
          () =>
            removeBlockedIdentityMock.mockResolvedValue(
              errorResult(ERROR_CODE.DB_NOT_FOUND),
            ),
          { error: ERROR_CODE.DB_NOT_FOUND },
        ],
        [
          'rejects',
          () => removeBlockedIdentityMock.mockRejectedValue(UNDO_FAILURE),
          { error: UNDO_FAILURE },
        ],
      ])(
        'logs once without the address and keeps the failure when the undo %s',
        async (_, failUndo, loggedError) => {
          setTenantSuspensionMock.mockResolvedValue(
            errorResult(ERROR_CODE.DB_NOT_FOUND),
          );
          failUndo();

          const result = await actions.suspendTenantAction(
            ACTIVE_TENANT.id,
            OWNER_BLOCK,
          );
          const [, context] = vi.mocked(logger.error).mock.calls[0] ?? [];

          expect(result).toEqual({
            outcome: ACTION_OUTCOME.REFUSED,
            reason: TENANT_REFUSAL.ARCHIVED,
          });
          expect(logger.error).toHaveBeenCalledTimes(1);
          expect(context).toEqual({ entryId: ENTRY.id, ...loggedError });
        },
      );
    });
  });
});
