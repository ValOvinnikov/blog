import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import {
  ADMIN_ROLE,
  BLOCKED_IDENTITY_KIND,
  TENANT_STATUS,
} from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_OWNER_EMAIL,
  MOCK_BLOCKED_ADDRESS_ENTRY_ID,
  mockBlockedAddressIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import {
  liftTenantSuspensionAction,
  suspendTenantAction,
} from './tenant-suspension-actions';

faker.seed(4417);

const {
  getTenantByIdMock,
  setTenantSuspensionMock,
  getTenantOwnerEmailMock,
  saveSignupBlockMock,
  recordSignupBlockAddedMock,
  removeBlockedIdentityMock,
  recordAuditEventMock,
} = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
  setTenantSuspensionMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
  saveSignupBlockMock: vi.fn(),
  recordSignupBlockAddedMock: vi.fn(),
  removeBlockedIdentityMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/signup-block/add-signup-block', () => ({
  saveSignupBlock: saveSignupBlockMock,
  recordSignupBlockAdded: recordSignupBlockAddedMock,
}));

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@platform/server/site-config/revalidate-site-config');

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

const requireSuperAdminMock = vi.mocked(requireSuperAdmin);
const revalidateSiteConfigMock = vi.mocked(revalidateSiteConfig);

const MOCK_SUPER_ADMIN = mockAdmin({ role: ADMIN_ROLE.SUPERADMIN });
const OWNER_EMAIL = MOCK_BLOCKED_OWNER_EMAIL;
const MOCK_UNDO_FAILURE = new Error(faker.lorem.sentence());
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const MOCK_CACHE_ERROR = new Error(faker.lorem.sentence());
const MOCK_ARCHIVED_AT = faker.date.past();

const ACTIVE_TENANT = mockTenant();

describe('tenant suspension actions', () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset();
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(ACTIVE_TENANT);
    setTenantSuspensionMock.mockReset();
    setTenantSuspensionMock.mockResolvedValue(okResult({}));
    getTenantOwnerEmailMock.mockReset().mockResolvedValue(OWNER_EMAIL);
    saveSignupBlockMock
      .mockReset()
      .mockResolvedValue(
        okResult({ entry: mockBlockedAddressIdentity(), created: true }),
      );
    recordSignupBlockAddedMock.mockReset();
    removeBlockedIdentityMock.mockReset().mockResolvedValue(okResult());
    vi.mocked(logger.error).mockReset();
    recordAuditEventMock.mockReset();
    revalidateSiteConfigMock.mockReset();
  });

  it('requires a super-admin session before reading the tenant', async () => {
    requireSuperAdminMock.mockImplementationOnce(() => {
      notFound();
    });

    await expect(suspendTenantAction(ACTIVE_TENANT.id)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(setTenantSuspensionMock).not.toHaveBeenCalled();
  });

  it('suspends the tenant, purges its cached site and records the operator action', async () => {
    const result = await suspendTenantAction(ACTIVE_TENANT.id);

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

    const result = await liftTenantSuspensionAction(ACTIVE_TENANT.id);

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

    const result = await suspendTenantAction(ACTIVE_TENANT.id);

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
      deprovisionedAt: MOCK_ARCHIVED_AT,
    },
  ])(
    'refuses an archived tenant ($status, deprovisionedAt $deprovisionedAt)',
    async (archived) => {
      getTenantByIdMock.mockResolvedValue({ ...ACTIVE_TENANT, ...archived });

      const result = await liftTenantSuspensionAction(ACTIVE_TENANT.id);

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

    const result = await suspendTenantAction(ACTIVE_TENANT.id);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a server error without an audit event when the write throws', async () => {
    setTenantSuspensionMock.mockRejectedValue(MOCK_DB_ERROR);

    const result = await suspendTenantAction(ACTIVE_TENANT.id);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  describe('when the operator also blocks the owner email', () => {
    const OWNER_BLOCK = { reason: MOCK_BLOCK_REASON };
    const SAVED_BLOCK = {
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: OWNER_EMAIL,
      reason: MOCK_BLOCK_REASON,
      admin: MOCK_SUPER_ADMIN,
    };

    it('blocks the owner address as the admin, suspends, then audits the block', async () => {
      const result = await suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

      expect(saveSignupBlockMock).toHaveBeenCalledWith(SAVED_BLOCK);
      expect(setTenantSuspensionMock).toHaveBeenCalledWith(
        ACTIVE_TENANT.id,
        TENANT_STATUS.SUSPENDED,
      );
      expect(recordSignupBlockAddedMock).toHaveBeenCalledWith(
        mockBlockedAddressIdentity(),
        MOCK_BLOCK_REASON,
      );
      expect(removeBlockedIdentityMock).not.toHaveBeenCalled();
      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    });

    it('trims the reason before storing it', async () => {
      await suspendTenantAction(ACTIVE_TENANT.id, {
        reason: `  ${MOCK_BLOCK_REASON}  `,
      });

      expect(saveSignupBlockMock).toHaveBeenCalledWith(SAVED_BLOCK);
    });

    it('does not audit a block that was already on the list', async () => {
      saveSignupBlockMock.mockResolvedValue(
        okResult({ entry: mockBlockedAddressIdentity(), created: false }),
      );

      const result = await suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

      expect(recordSignupBlockAddedMock).not.toHaveBeenCalled();
      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    });

    it('rejects a blank reason without blocking or suspending', async () => {
      const result = await suspendTenantAction(ACTIVE_TENANT.id, {
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

      const result = await suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

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

      const result = await suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(setTenantSuspensionMock).not.toHaveBeenCalled();
      expect(recordAuditEventMock).not.toHaveBeenCalled();
    });

    it('blocks nothing for an unknown tenant', async () => {
      getTenantByIdMock.mockResolvedValue(undefined);

      await suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

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
          () => setTenantSuspensionMock.mockRejectedValue(MOCK_DB_ERROR),
          { outcome: ACTION_OUTCOME.SERVER_ERROR },
        ],
      ])(
        'removes the block it created and audits no add when the suspension %s',
        async (_, failSuspension, expected) => {
          failSuspension();

          const result = await suspendTenantAction(
            ACTIVE_TENANT.id,
            OWNER_BLOCK,
          );

          expect(result).toEqual(expected);
          expect(removeBlockedIdentityMock).toHaveBeenCalledWith(
            MOCK_BLOCKED_ADDRESS_ENTRY_ID,
          );
          expect(recordSignupBlockAddedMock).not.toHaveBeenCalled();
          expect(recordAuditEventMock).not.toHaveBeenCalled();
        },
      );

      it('keeps the block and audits it once when only the cache purge fails', async () => {
        revalidateSiteConfigMock.mockRejectedValue(MOCK_CACHE_ERROR);

        const result = await suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

        expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
        expect(removeBlockedIdentityMock).not.toHaveBeenCalled();
        expect(recordSignupBlockAddedMock).toHaveBeenCalledTimes(1);
        expect(recordSignupBlockAddedMock).toHaveBeenCalledWith(
          mockBlockedAddressIdentity(),
          MOCK_BLOCK_REASON,
        );
      });

      it('keeps a block that was already on the list', async () => {
        saveSignupBlockMock.mockResolvedValue(
          okResult({ entry: mockBlockedAddressIdentity(), created: false }),
        );
        setTenantSuspensionMock.mockResolvedValue(
          errorResult(ERROR_CODE.DB_NOT_FOUND),
        );

        await suspendTenantAction(ACTIVE_TENANT.id, OWNER_BLOCK);

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
          () => removeBlockedIdentityMock.mockRejectedValue(MOCK_UNDO_FAILURE),
          { errorName: MOCK_UNDO_FAILURE.name },
        ],
      ])(
        'logs once without the address and keeps the failure when the undo %s',
        async (_, failUndo, loggedError) => {
          setTenantSuspensionMock.mockResolvedValue(
            errorResult(ERROR_CODE.DB_NOT_FOUND),
          );
          failUndo();

          const result = await suspendTenantAction(
            ACTIVE_TENANT.id,
            OWNER_BLOCK,
          );
          const [, context] = vi.mocked(logger.error).mock.calls[0] ?? [];

          expect(result).toEqual({
            outcome: ACTION_OUTCOME.REFUSED,
            reason: TENANT_REFUSAL.ARCHIVED,
          });
          expect(logger.error).toHaveBeenCalledTimes(1);
          expect(context).toEqual({
            entryId: MOCK_BLOCKED_ADDRESS_ENTRY_ID,
            ...loggedError,
          });
        },
      );
    });
  });
});
