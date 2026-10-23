import { AUDIT_ACTION, ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
} from '@blog/db/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import {
  finishProvisioningRun,
  setTenantProvisioningStatus,
  startProvisioningRun,
} from '@blog/db/queries/tenants';
import { errorResult, okResult } from '@blog/utils/result';
import { TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';

import { beginRun, finishRun } from './run-lifecycle';

const CTX = { runId: 'run-1' };

vi.mock('@blog/db/queries/audit-events', () => ({ insertAuditEvent: vi.fn() }));
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);

function recordedActions(): string[] {
  return vi.mocked(insertAuditEvent).mock.calls.map(([event]) => event.action);
}

describe(beginRun, () => {
  it('marks the run as started for the tenant', async () => {
    vi.mocked(startProvisioningRun).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await beginRun(TEST_TENANT_ID);

    expect(startProvisioningRun).toHaveBeenCalledWith({
      tenantId: TEST_TENANT_ID,
    });
  });
});

describe(finishRun, () => {
  beforeEach(() => {
    vi.mocked(finishProvisioningRun).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );
    vi.mocked(setTenantProvisioningStatus).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );
  });

  it('closes the run and audits a successful provisioning', async () => {
    await finishRun(TEST_TENANT_ID, CTX, okResult());

    expect(finishProvisioningRun).toHaveBeenCalledWith({
      tenantId: TEST_TENANT_ID,
    });
    expect(recordedActions()).toEqual([AUDIT_ACTION.PROVISIONED]);
  });

  it('audits the failed step of a failed run without overriding its status', async () => {
    await finishRun(
      TEST_TENANT_ID,
      CTX,
      errorResult({ failedStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN }),
    );

    expect(recordedActions()).toEqual([AUDIT_ACTION.PROVISIONING_FAILED]);
    expect(insertAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
          runId: CTX.runId,
        }),
      }),
    );
    expect(setTenantProvisioningStatus).not.toHaveBeenCalled();
  });

  it('marks the tenant failed when a run dies outside any step', async () => {
    await finishRun(
      TEST_TENANT_ID,
      CTX,
      errorResult({ message: 'workflow crashed' }),
    );

    expect(setTenantProvisioningStatus).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      TENANT_PROVISIONING_STATUS.FAILED,
    );
    expect(recordedActions()).toEqual([AUDIT_ACTION.PROVISIONING_FAILED]);
  });

  it('still finishes when the audit event cannot be written', async () => {
    vi.mocked(insertAuditEvent).mockRejectedValue(new Error('db down'));

    await expect(
      finishRun(TEST_TENANT_ID, CTX, okResult()),
    ).resolves.toBeUndefined();
  });
});
