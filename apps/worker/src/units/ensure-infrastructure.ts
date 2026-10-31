import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { okResult } from '@blog/utils/result';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { createTenantRevalidateWebhook } from '@worker/steps/create-revalidate-webhook';
import { mapTenantDomain } from '@worker/steps/map-domain';
import { persistTenantSanityToken } from '@worker/steps/persist-sanity-token';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';

import { ensureSanityProject } from './ensure-sanity-project';
import {
  loadTenant,
  runReportedStep,
  type TUnitContext,
  type TUnitResult,
} from './run-reported-step';

export async function ensureInfrastructure(
  tenantId: string,
  ctx: TUnitContext,
): Promise<TUnitResult> {
  'use step';

  const env = getProvisionEnv();
  let tenant: TTenant = await loadTenant(tenantId);

  const phases = [
    {
      step: TENANT_PROVISIONING_STEP.SANITY_PROJECT,
      run: async () => {
        tenant = await ensureSanityProject(tenantId, env);
      },
    },
    {
      step: TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
      run: () => persistTenantSanityToken(tenant),
    },
    {
      step: TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
      run: () => createTenantRevalidateWebhook(tenant, env),
    },
    {
      step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      run: () => mapTenantDomain(tenant.primaryDomain, env),
    },
  ];

  for (const { step, run } of phases) {
    const result = await runReportedStep({ tenantId, ctx, step, run });
    if (!result.ok) return result;
  }
  return okResult();
}

ensureInfrastructure.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
