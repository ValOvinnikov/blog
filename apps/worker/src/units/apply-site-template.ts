import {
  STARTER_PRESET_BY_SITE_TYPE,
  STARTER_TEMPLATE_VERSION,
  toStarterSiteType,
} from '@blog/config';
import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { insertSiteConfigIfMissing } from '@blog/db/queries/site-config';
import { setTenantSiteTemplateVersion } from '@blog/db/queries/tenants';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { seedTenantContent } from '@worker/steps/seed-content';
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

  const tenant = await loadTenant(tenantId);
  const siteType = toStarterSiteType(tenant.siteType);

  return runReportedStep({
    tenantId,
    ctx,
    step: TENANT_PROVISIONING_STEP.SEED_CONTENT,
    run: async () => {
      await seedTenantContent(tenant, siteType, seedContentDeps);
      await insertSiteConfigIfMissing(
        tenantId,
        STARTER_PRESET_BY_SITE_TYPE[siteType],
      );
      await setTenantSiteTemplateVersion(tenantId, STARTER_TEMPLATE_VERSION);
    },
  });
}

applySiteTemplate.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
