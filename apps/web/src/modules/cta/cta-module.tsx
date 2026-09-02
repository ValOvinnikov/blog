import { getSanityImageBaseUrl, service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { CtaModuleView } from './cta-module-view';

export interface ICtaModuleProps {
  id: string;
  locale: string;
}

/**
 * CtaModule — fetches `module_cta` data and hands it to `CtaModuleView`.
 */
export const CtaModule = async ({ id }: ICtaModuleProps) => {
  const tenant = await getTenantSanityContext();
  const result = await service.modules.cta.v1.getCta(id, tenant);

  if (!result.ok) return null;

  return (
    <CtaModuleView id={id} {...result.data} baseUrl={getSanityImageBaseUrl()} />
  );
};
