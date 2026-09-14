import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { HeroBlogModuleView } from './hero-blog-module-view';

export interface IHeroBlogModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * HeroBlogModule — fetches `module_heroBlog` data and renders nothing when
 * no post resolves for it.
 */
export const HeroBlogModule = async ({ id, tenant }: IHeroBlogModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.heroBlog.v1.getHeroBlog(
    id,
    tenantContext,
  );

  if (!result.ok) return null;

  const { data } = result;

  if (!data.hasPost) {
    logger.error('hero_blog_module.post_unresolved', { id });
    return null;
  }

  return <HeroBlogModuleView id={id} {...data} />;
};
