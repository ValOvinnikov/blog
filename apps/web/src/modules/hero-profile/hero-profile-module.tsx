import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { HeroProfileModuleView } from './hero-profile-module-view';

export interface IHeroProfileModuleProps {
  id: string;
}

export const HeroProfileModule = async ({ id }: IHeroProfileModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.heroProfile.v1.getHeroProfile(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('hero_profile_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  return <HeroProfileModuleView id={id} {...result.data} />;
};
