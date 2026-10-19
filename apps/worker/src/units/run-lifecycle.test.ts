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

import { beginRun, finishRun } from './run-lifecycle';

const TENANT_ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';
const CTX = { runId: 'run-1' };

vi.mock('@worker/utils/logger/logger');
vi.mock('@blog/db/queries/audit-events', () => ({ insertAuditEvent: vi.fn() }));
vi.mock('@blog/db/queries/tenants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/db/queries/tenants')>()),
  startProvisioningRun: vi.fn(),
  finishProvisioningRun: vi.fn(),
  setTenantProvisioningStatus: vi.fn(),
}));

function recordedActions(): string[] {
  return vi.mocked(insertAuditEvent).mock.calls.map(([event]) => event.action);
}

describe(beginRun, () => {
  it('marks the run as started for the tenant', async () => {
    vi.mocked(startProvisioningRun).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    await beginRun(TENANT_ID);

    expect(startProvisioningRun).toHaveBeenCalledWith({ tenantId: TENANT_ID });
  });
});

describe(finishRun, () => {
  beforeEach(() => {
    vi.mocked(finishProvisioningRun).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
    vi.mocked(setTenantProvisioningStatus).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });

  it('closes the run and audits a successful provisioning', async () => {
    await finishRun(TENANT_ID, CTX, { ok: true });

    expect(finishProvisioningRun).toHaveBeenCalledWith({ tenantId: TENANT_ID });
    expect(recordedActions()).toEqual([AUDIT_ACTION.PROVISIONED]);
  });

  it('audits the failed step of a failed run without overriding its status', async () => {
    await finishRun(TENANT_ID, CTX, {
      ok: false,
      failedStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    });

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
    await finishRun(TENANT_ID, CTX, { ok: false, error: 'workflow crashed' });

    expect(setTenantProvisioningStatus).toHaveBeenCalledWith(
      TENANT_ID,
      TENANT_PROVISIONING_STATUS.FAILED,
    );
    expect(recordedActions()).toEqual([AUDIT_ACTION.PROVISIONING_FAILED]);
  });

  it('still finishes when the audit event cannot be written', async () => {
    vi.mocked(insertAuditEvent).mockRejectedValue(new Error('db down'));

    await expect(
      finishRun(TENANT_ID, CTX, { ok: true }),
    ).resolves.toBeUndefined();
  });
});
