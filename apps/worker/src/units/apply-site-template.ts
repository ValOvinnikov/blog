import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { seedTenantContent } from '@worker/steps/seed-content';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { seedContentDeps } from '@worker/utils/step-deps/step-deps';

import {
  loadTenant,
  runReportedStep,
  type TUnitContext,
  type TUnitResult,
} from './run-reported-step';

export async function applySiteTemplate(
  tenantId: string,
  ctx: TUnitContext,
): Promise<TUnitResult> {
  'use step';

  const env = getProvisionEnv();
  const tenant = await loadTenant(tenantId);

  return runReportedStep({
    tenantId,
    ctx,
    step: TENANT_PROVISIONING_STEP.SEED_CONTENT,
    run: () => seedTenantContent(tenant, env, seedContentDeps),
  });
}

applySiteTemplate.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
