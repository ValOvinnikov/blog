import {
  DEPROVISIONING_STEP,
  type TDeprovisioningStep,
} from '@blog/db/constants';
import { clearTenantProvisioningArtifacts } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { archiveTenantRow } from '@worker/steps/deprovisioning/archive-tenant-row';
import { archiveTenantSanityProject } from '@worker/steps/deprovisioning/archive-tenant-sanity-project';
import { purgeTenantReaderData } from '@worker/steps/deprovisioning/purge-tenant-reader-data';
import { removeTenantDomain } from '@worker/steps/deprovisioning/remove-tenant-domain';
import { revokeTenantSanityTokens } from '@worker/steps/deprovisioning/revoke-tenant-sanity-tokens';
import {
  getDeprovisionEnv,
  type TDeprovisionEnv,
} from '@worker/utils/deprovision-env/deprovision-env';
import { DEPROVISIONING_STEP_REPORTER } from '@worker/utils/deprovisioning-report/deprovisioning-report';

import {
  loadTenant,
  runStepWithReporter,
  type TUnitContext,
  type TUnitResult,
} from './run-reported-step';

type TDeprovisioningStepRunner = (
  tenant: TTenant,
  env: TDeprovisionEnv,
  runId: string,
) => Promise<void>;

const DEPROVISIONING_STEP_RUNNERS: Record<
  TDeprovisioningStep,
  TDeprovisioningStepRunner
> = {
  [DEPROVISIONING_STEP.REMOVE_DOMAIN]: removeTenantDomain,
  [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: archiveTenantSanityProject,
  [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: revokeTenantSanityTokens,
  [DEPROVISIONING_STEP.CLEAR_ARTIFACTS]: ({ id }) =>
    clearTenantProvisioningArtifacts(id),
  [DEPROVISIONING_STEP.ARCHIVE_TENANT]: (tenant, _env, runId) =>
    archiveTenantRow(tenant, runId),
  [DEPROVISIONING_STEP.PURGE_READER_DATA]: ({ id }, _env, runId) =>
    purgeTenantReaderData(id, runId),
  [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: ({ id }, env) =>
    requestTenantCacheInvalidation({
      webAppUrl: env.webAppBaseUrl,
      secret: env.siteConfigRevalidateSecret,
      tenantId: id,
    }),
};

export async function runDeprovisioningStep(
  tenantId: string,
  ctx: TUnitContext,
  step: TDeprovisioningStep,
): Promise<TUnitResult<TDeprovisioningStep>> {
  'use step';

  return runStepWithReporter(DEPROVISIONING_STEP_REPORTER, {
    tenantId,
    ctx,
    step,
    run: async () => {
      const env = getDeprovisionEnv();
      const tenant = await loadTenant(tenantId);
      await DEPROVISIONING_STEP_RUNNERS[step](tenant, env, ctx.runId);
    },
  });
}

runDeprovisioningStep.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
