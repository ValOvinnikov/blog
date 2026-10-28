import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  MIGRATION_ENVIRONMENT,
  RELEASE_REFUSAL,
} from '@platform/constants/release';
import { auth } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import { MOCK_GITHUB_TENANT_MIGRATION_DISPATCH_PATH } from '@platform/testing/github/fixtures';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { MOCK_MIGRATION_FAILED_AT } from '@platform/testing/releases/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import type { Session } from 'next-auth';

import { startTenantMigrationsAction } from './start-tenant-migrations-action';

faker.seed(5284);

const { insertAuditEventMock, listActiveTenantsMock } = vi.hoisted(() => ({
  insertAuditEventMock: vi.fn(),
  listActiveTenantsMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    auditEvents: { insertAuditEvent: insertAuditEventMock },
    tenants: { listActiveTenants: listActiveTenantsMock },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const PRODUCTION_RETRY = {
  environment: MIGRATION_ENVIRONMENT.PRODUCTION,
  tenantId: MOCK_TENANT_ID,
};

describe(startTenantMigrationsAction, () => {
  const github = useGitHubFetch();

  const dispatchedInputs = () => {
    const call = github.fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith(MOCK_GITHUB_TENANT_MIGRATION_DISPATCH_PATH),
    );
    return call && JSON.parse(String(call[1].body)).inputs;
  };

  beforeEach(() => {
    authMock.mockReset().mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    github.respond(
      MOCK_GITHUB_TENANT_MIGRATION_DISPATCH_PATH,
      () => new Response(null, { status: HTTP_STATUS.NO_CONTENT }),
    );
    insertAuditEventMock.mockReset();
    listActiveTenantsMock
      .mockReset()
      .mockResolvedValue([
        mockTenant({ contentMigrationFailedAt: MOCK_MIGRATION_FAILED_AT }),
      ]);
  });

  it('requires a super-admin before dispatching anything', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(startTenantMigrationsAction(PRODUCTION_RETRY)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(dispatchedInputs()).toBeUndefined();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('migrates every development tenant and records who started it', async () => {
    const result = await startTenantMigrationsAction({
      environment: MIGRATION_ENVIRONMENT.DEVELOPMENT,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchedInputs()).toEqual({
      environment: MIGRATION_ENVIRONMENT.DEVELOPMENT,
    });
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.TENANT_MIGRATIONS_STARTED,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: MIGRATION_ENVIRONMENT.DEVELOPMENT,
      details: { environment: MIGRATION_ENVIRONMENT.DEVELOPMENT },
    });
  });

  it('retries only the failed tenant on production and records it against that tenant', async () => {
    const result = await startTenantMigrationsAction(PRODUCTION_RETRY);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchedInputs()).toEqual(PRODUCTION_RETRY);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.TENANT_MIGRATIONS_STARTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { environment: MIGRATION_ENVIRONMENT.PRODUCTION },
    });
  });

  it('refuses production without a tenant, dispatching and recording nothing', async () => {
    const result = await startTenantMigrationsAction({
      environment: MIGRATION_ENVIRONMENT.PRODUCTION,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.TENANT_REQUIRED,
    });
    expect(dispatchedInputs()).toBeUndefined();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('refuses a production tenant whose last migration did not fail', async () => {
    listActiveTenantsMock.mockResolvedValue([mockTenant()]);

    const result = await startTenantMigrationsAction(PRODUCTION_RETRY);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.TENANT_MIGRATION_NOT_FAILED,
    });
    expect(dispatchedInputs()).toBeUndefined();
  });

  it('is unavailable when the failed tenants cannot be read', async () => {
    listActiveTenantsMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    const result = await startTenantMigrationsAction(PRODUCTION_RETRY);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(dispatchedInputs()).toBeUndefined();
  });

  it('rejects an environment or tenant id it does not know', async () => {
    const result = await startTenantMigrationsAction({
      environment: MIGRATION_ENVIRONMENT.PRODUCTION,
      tenantId: faker.lorem.word(),
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(dispatchedInputs()).toBeUndefined();
  });

  it('records no audit event when the dispatch fails', async () => {
    github.respond(MOCK_GITHUB_TENANT_MIGRATION_DISPATCH_PATH, () =>
      mockGitHubResponse({}, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    const result = await startTenantMigrationsAction(PRODUCTION_RETRY);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still succeeds when the audit write is lost', async () => {
    insertAuditEventMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    const result = await startTenantMigrationsAction(PRODUCTION_RETRY);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });
});
