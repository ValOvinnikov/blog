import {
  STARTER_PRESET_BY_SITE_TYPE,
  STARTER_TEMPLATE_VERSION,
  toStarterSiteType,
} from '@shinefold/config';
import { MODULE_PACK } from '@shinefold/config/constants';
import {
  PLAN_ENTITLEMENTS,
  TENANT_PROVISIONING_STEP,
} from '@shinefold/db/constants';
import { insertSiteConfigIfMissing } from '@shinefold/db/queries/site-config';
import { setTenantSiteTemplateVersion } from '@shinefold/db/queries/tenants';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { applyGrowthLayer } from '@worker/steps/apply-growth-layer';
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

  const { productName } = getProvisionEnv();
  const tenant = await loadTenant(tenantId);
  const siteType = toStarterSiteType(tenant.siteType);

  return runReportedStep({
    tenantId,
    ctx,
    step: TENANT_PROVISIONING_STEP.SEED_CONTENT,
    run: async () => {
      await seedTenantContent(tenant, siteType, productName, seedContentDeps);
      if (
        PLAN_ENTITLEMENTS[tenant.plan].modulePacks.includes(MODULE_PACK.GROWTH)
      ) {
        await applyGrowthLayer({ tenantId, siteType, locale: tenant.locale });
      }
      await insertSiteConfigIfMissing(
        tenantId,
        STARTER_PRESET_BY_SITE_TYPE[siteType],
      );
      await setTenantSiteTemplateVersion(tenantId, STARTER_TEMPLATE_VERSION);
    },
  });
}

applySiteTemplate.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
