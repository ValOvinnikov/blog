import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { verifyTenantSeededContent } from '@worker/utils/db-provisioning-steps/db-provisioning-steps';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { verifyContentDeps } from '@worker/utils/step-deps/step-deps';

import {
  loadTenant,
  runReportedStep,
  type TUnitContext,
  type TUnitResult,
} from './run-reported-step';

export async function verifyTenant(
  tenantId: string,
  ctx: TUnitContext,
): Promise<TUnitResult> {
  'use step';

  const env = getProvisionEnv();
  const tenant = await loadTenant(tenantId);

  return runReportedStep({
    tenantId,
    ctx,
    step: TENANT_PROVISIONING_STEP.VERIFY_CONTENT,
    run: () => verifyTenantSeededContent(tenant, env, verifyContentDeps),
  });
}

verifyTenant.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
