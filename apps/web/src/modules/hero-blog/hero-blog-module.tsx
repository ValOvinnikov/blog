import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { HeroBlogModuleView } from './hero-blog-module-view';

export interface IHeroBlogModuleProps {
  id: string;
}

export const HeroBlogModule = async ({ id }: IHeroBlogModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.heroBlog.v1.getHeroBlog(
    id,
    sanityContext,
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
    if (!data.isPostUntranslated) {
      logger.error('hero_blog_module.post_unresolved', { id });
    }
    return null;
  }

  return <HeroBlogModuleView id={id} {...data} />;
};
