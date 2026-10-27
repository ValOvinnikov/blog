import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  TENANT_DELETE_OUTCOME,
  TENANT_DELETE_SANITY_PROJECT_OUTCOME,
} from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import {
  TENANT_FIELD_ERROR,
  TENANT_LOG,
  TENANT_REFUSAL,
} from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { deleteTenantAction } from './delete-tenant-action';

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantById: vi.fn(), deleteTenant: vi.fn() },
    auditEvents: { insertAuditEvent: vi.fn() },
  },
}));

faker.seed(5997);

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);
const deleteTenantMock = vi.mocked(queries.tenants.deleteTenant);
const insertAuditEventMock = vi.mocked(queries.auditEvents.insertAuditEvent);
const loggerErrorMock = vi.mocked(logger.error);

const MOCK_WRONG_NAME = faker.lorem.words(3);
const MOCK_CONNECTION_ERROR = new Error(faker.lorem.words(2));

const archivedTenant = mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT });

describe(deleteTenantAction, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(archivedTenant);
    deleteTenantMock.mockReset();
    deleteTenantMock.mockResolvedValue({
      outcome: TENANT_DELETE_OUTCOME.DELETED,
      sanityProject: TENANT_DELETE_SANITY_PROJECT_OUTCOME.NO_PROJECT,
    });
    insertAuditEventMock.mockReset();
  });

  it('stops before any tenant work when the super-admin gate rejects', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(
      deleteTenantAction(MOCK_TENANT_ID, { confirm: MOCK_TENANT_NAME }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it('rejects a confirmation that does not match the tenant name', async () => {
    const result = await deleteTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_WRONG_NAME,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      scenario: 'refuses a live tenant',
      deleteOutcome: TENANT_DELETE_OUTCOME.NOT_ARCHIVED,
      reason: TENANT_REFUSAL.NOT_ARCHIVED,
    },
    {
      scenario: 'reports the tenant gone',
      deleteOutcome: TENANT_DELETE_OUTCOME.NOT_FOUND,
      reason: TENANT_REFUSAL.NOT_FOUND,
    },
  ] as const)(
    'refuses without an audit event when the mutation $scenario',
    async ({ deleteOutcome, reason }) => {
      deleteTenantMock.mockResolvedValueOnce({ outcome: deleteOutcome });

      const result = await deleteTenantAction(MOCK_TENANT_ID, {
        confirm: MOCK_TENANT_NAME,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
      expect(insertAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it('deletes the tenant and records a DELETED audit event', async () => {
    const result = await deleteTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(deleteTenantMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.DELETED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { name: MOCK_TENANT_NAME },
    });
  });

  it('returns a server error and records no audit event when the delete throws', async () => {
    deleteTenantMock.mockRejectedValueOnce(MOCK_CONNECTION_ERROR);

    const result = await deleteTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(TENANT_LOG.DELETE_FAILED, {
      tenantId: MOCK_TENANT_ID,
      errorName: MOCK_CONNECTION_ERROR.name,
    });
  });

  it('still succeeds, and logs the failure, when the audit write fails', async () => {
    insertAuditEventMock.mockRejectedValueOnce(MOCK_CONNECTION_ERROR);

    const result = await deleteTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.DELETE_AUDIT_FAILED,
      {
        action: AUDIT_ACTION.DELETED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        errorName: MOCK_CONNECTION_ERROR.name,
      },
    );
  });
});
