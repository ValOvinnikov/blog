import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { CtaModuleView } from './cta-module-view';

export interface ICtaModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const CtaModule = async ({ id, tenant }: ICtaModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.cta.v1.getCta(id, tenantContext);

  if (!result.ok) {
    logger.error('cta_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  return <CtaModuleView id={id} {...result.data} />;
};
