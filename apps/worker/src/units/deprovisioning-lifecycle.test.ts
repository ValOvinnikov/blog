import { DEPROVISIONING_STEP } from '@blog/db/constants';
import {
  finishDeprovisioningRun,
  getTenantById,
  startDeprovisioningRun,
} from '@blog/db/queries/tenants';
import { DEPROVISIONING_RUN_FAILED_EVENT } from '@worker/constants/deprovisioning';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { alertOperatorsToDeleteSanityProject } from '@worker/utils/operator-email/sanity-project-deletion-alert';

import {
  beginDeprovisioning,
  finishDeprovisioning,
} from './deprovisioning-lifecycle';

const CTX = { runId: 'deprovision-lifecycle-run' };
const CRASH = 'lost the database';
const ARCHIVED_TENANT = makeTenant({ deprovisionedAt: new Date(0) });

vi.mock('@worker/utils/operator-email/sanity-project-deletion-alert');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);

describe(beginDeprovisioning, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());
    vi.mocked(startDeprovisioningRun).mockResolvedValue({
      ok: true,
      data: makeTenant(),
    });
  });

  it('records the run start for a tenant still to deprovision', async () => {
    await expect(beginDeprovisioning(TEST_TENANT_ID)).resolves.toBe(true);

    expect(startDeprovisioningRun).toHaveBeenCalledWith({
      tenantId: TEST_TENANT_ID,
    });
  });

  it('records nothing for an already-deprovisioned tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(ARCHIVED_TENANT);

    await expect(beginDeprovisioning(TEST_TENANT_ID)).resolves.toBe(false);

    expect(startDeprovisioningRun).not.toHaveBeenCalled();
  });
});

describe(finishDeprovisioning, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(ARCHIVED_TENANT);
    vi.mocked(finishDeprovisioningRun).mockResolvedValue({
      ok: true,
      data: ARCHIVED_TENANT,
    });
  });

  it('records the run finish and alerts the operators after a successful run', async () => {
    await finishDeprovisioning(TEST_TENANT_ID, CTX, { ok: true });

    expect(finishDeprovisioningRun).toHaveBeenCalledWith({
      tenantId: TEST_TENANT_ID,
    });
    expect(alertOperatorsToDeleteSanityProject).toHaveBeenCalledWith(
      ARCHIVED_TENANT,
    );
  });

  it('alerts nobody after a failed step', async () => {
    await finishDeprovisioning(TEST_TENANT_ID, CTX, {
      ok: false,
      failedStep: DEPROVISIONING_STEP.ARCHIVE_TENANT,
    });

    expect(finishDeprovisioningRun).toHaveBeenCalled();
    expect(alertOperatorsToDeleteSanityProject).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a run that failed outside any step', async () => {
    await finishDeprovisioning(TEST_TENANT_ID, CTX, {
      ok: false,
      error: CRASH,
    });

    expect(logger.error).toHaveBeenCalledWith(DEPROVISIONING_RUN_FAILED_EVENT, {
      tenantId: TEST_TENANT_ID,
      runId: CTX.runId,
      error: CRASH,
    });
    expect(alertOperatorsToDeleteSanityProject).not.toHaveBeenCalled();
  });
});
