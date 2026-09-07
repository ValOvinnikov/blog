import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { HeroBlogModuleView } from './hero-blog-module-view';

export interface IHeroBlogModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * HeroBlogModule — fetches `module_heroBlog` data and hands it to
 * `HeroBlogModuleView`. The schema requires a resolvable post (pinned or
 * newest featured), so `heading` is never empty at render time.
 */
export const HeroBlogModule = async ({ id, tenant }: IHeroBlogModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.heroBlog.v1.getHeroBlog(
    id,
    tenantContext,
  );

  if (!result.ok) return null;

  const { heading } = result.data;

  return (
    <HeroBlogModuleView id={id} {...result.data} heading={heading as string} />
  );
};
