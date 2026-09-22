import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { HeroBlogModuleView } from './hero-blog-module-view';

export interface IHeroBlogModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const HeroBlogModule = async ({ id, tenant }: IHeroBlogModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.heroBlog.v1.getHeroBlog(
    id,
    tenantContext,
  );

  if (!result.ok) {
    logger.error('hero_blog_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  const { data } = result;

  if (!data.hasPost) {
    logger.error('hero_blog_module.post_unresolved', { id });
    return null;
  }

  return <HeroBlogModuleView id={id} {...data} />;
};
