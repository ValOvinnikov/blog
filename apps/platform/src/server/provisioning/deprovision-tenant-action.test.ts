import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import {
  DEPROVISION_PATH,
  PROVISIONING_LOG,
} from '@platform/constants/provisioning';
import {
  TENANT_FIELD_ERROR,
  TENANT_LOG,
  TENANT_REFUSAL,
} from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
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

import { deprovisionTenantAction } from './deprovision-tenant-action';
import { enqueueWorkerRequest } from './enqueue-provisioning';

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/tenants/resolve-is-platform-tenant');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantById: vi.fn() },
    auditEvents: { insertAuditEvent: vi.fn() },
  },
}));

vi.mock('@platform/server/provisioning/enqueue-provisioning');

faker.seed(5997);

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);
const insertAuditEventMock = vi.mocked(queries.auditEvents.insertAuditEvent);
const enqueueMock = vi.mocked(enqueueWorkerRequest);
const loggerErrorMock = vi.mocked(logger.error);
const resolveIsPlatformTenantMock = vi.mocked(resolveIsPlatformTenant);

const MOCK_WRONG_NAME = faker.lorem.words(3);
const MOCK_CONNECTION_ERROR = new Error(faker.lorem.words(2));

describe(deprovisionTenantAction, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockTenant());
    enqueueMock.mockReset();
    enqueueMock.mockResolvedValue(HTTP_STATUS.ACCEPTED);
    insertAuditEventMock.mockReset();
    resolveIsPlatformTenantMock.mockReset().mockResolvedValue(false);
  });

  it('stops before any tenant work when the super-admin gate rejects', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(
      deprovisionTenantAction(MOCK_TENANT_ID, {
        confirm: MOCK_TENANT_NAME,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('rejects a confirmation that does not match the tenant name', async () => {
    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_WRONG_NAME,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('refuses a tenant that is already deprovisioned', async () => {
    getTenantByIdMock.mockResolvedValueOnce(
      mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );

    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_DEPROVISIONED,
    });
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('refuses the platform tenant without enqueuing or auditing, and logs it', async () => {
    resolveIsPlatformTenantMock.mockResolvedValue(true);

    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toStrictEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.PLATFORM_TENANT,
    });
    expect(enqueueMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      TENANT_LOG.PLATFORM_TENANT_REFUSED,
      { tenantId: MOCK_TENANT_ID, action: AUDIT_ACTION.DEPROVISION_REQUESTED },
    );
  });

  it('starts the worker run when confirm matches the name', async () => {
    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(enqueueMock).toHaveBeenCalledWith(DEPROVISION_PATH, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('records a DEPROVISION_REQUESTED audit event once the worker accepts', async () => {
    await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { name: MOCK_TENANT_NAME },
    });
  });

  it('returns a server error and no audit event when the worker is unreachable', async () => {
    enqueueMock.mockResolvedValueOnce(null);

    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns a server error, logs the status and writes no audit event when the worker rejects', async () => {
    enqueueMock.mockResolvedValueOnce(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      PROVISIONING_LOG.DEPROVISION_ENQUEUE_REJECTED,
      {
        tenantId: MOCK_TENANT_ID,
        responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  });

  it('still succeeds, and logs the failure, when the audit write fails', async () => {
    insertAuditEventMock.mockRejectedValueOnce(MOCK_CONNECTION_ERROR);

    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      PROVISIONING_LOG.DEPROVISION_AUDIT_FAILED,
      {
        action: AUDIT_ACTION.DEPROVISION_REQUESTED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        errorName: MOCK_CONNECTION_ERROR.name,
      },
    );
  });
});
