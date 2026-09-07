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
 * HeroBlogModule — fetches `module_heroBlog` data and hands it to
 * `HeroBlogModuleView`. The schema requires a resolvable post at author
 * time, but Sanity validation doesn't re-run on an already-published
 * document — its pinned or newest-featured post can be unpublished,
 * unfeatured, or deleted afterwards, leaving `heading` unresolved.
 */
export const HeroBlogModule = async ({ id, tenant }: IHeroBlogModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.heroBlog.v1.getHeroBlog(
    id,
    tenantContext,
  );

  if (!result.ok) return null;

  const { heading } = result.data;

  if (!heading) {
    logger.error('hero_blog_module.post_unresolved', { id });
    return null;
  }

  return <HeroBlogModuleView id={id} {...result.data} heading={heading} />;
};
