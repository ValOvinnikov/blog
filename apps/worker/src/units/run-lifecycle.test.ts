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
import { PROVISIONING_AUDIT_VIA } from '@worker/constants/provisioning';
import {
  MOCK_DB_DOWN,
  MOCK_WORKFLOW_CRASH,
} from '@worker/testing/outage/fixtures';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';

import { beginRun, finishRun } from './run-lifecycle';

vi.mock('@blog/db/queries/audit-events');
vi.mock('@blog/db/queries/tenants');

function recordedActions(): string[] {
  return vi.mocked(insertAuditEvent).mock.calls.map(([event]) => event.action);
}

describe(beginRun, () => {
  it('marks the run as started for the tenant', async () => {
    vi.mocked(startProvisioningRun).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await beginRun(MOCK_TENANT_ID);

    expect(startProvisioningRun).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
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
    await finishRun(MOCK_TENANT_ID, MOCK_RUN_CONTEXT, okResult());

    expect(finishProvisioningRun).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
    });
    expect(recordedActions()).toEqual([AUDIT_ACTION.PROVISIONED]);
  });

  it('audits the failed step without overriding the tenant status', async () => {
    await finishRun(
      MOCK_TENANT_ID,
      MOCK_RUN_CONTEXT,
      errorResult({ failedStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN }),
    );

    expect(recordedActions()).toEqual([AUDIT_ACTION.PROVISIONING_FAILED]);
    const [event] = vi.mocked(insertAuditEvent).mock.lastCall ?? [];
    expect(event?.details).toEqual({
      via: PROVISIONING_AUDIT_VIA,
      runId: MOCK_RUN_CONTEXT.runId,
      step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    });
    expect(setTenantProvisioningStatus).not.toHaveBeenCalled();
  });

  it('marks the tenant failed when a run dies outside any step', async () => {
    await finishRun(
      MOCK_TENANT_ID,
      MOCK_RUN_CONTEXT,
      errorResult({ message: MOCK_WORKFLOW_CRASH }),
    );

    expect(setTenantProvisioningStatus).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      TENANT_PROVISIONING_STATUS.FAILED,
    );
    expect(recordedActions()).toEqual([AUDIT_ACTION.PROVISIONING_FAILED]);
  });

  it('still finishes when the audit event cannot be written', async () => {
    vi.mocked(insertAuditEvent).mockRejectedValue(new Error(MOCK_DB_DOWN));

    await expect(
      finishRun(MOCK_TENANT_ID, MOCK_RUN_CONTEXT, okResult()),
    ).resolves.toBeUndefined();
  });
});
