import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { CtaModuleView } from './cta-module-view';

export interface ICtaModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * CtaModule — fetches `module_cta` data and hands it to `CtaModuleView`.
 */
export const CtaModule = async ({ id, tenant }: ICtaModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.cta.v1.getCta(id, tenantContext);

  if (!result.ok) return null;

  return <CtaModuleView id={id} {...result.data} />;
};
