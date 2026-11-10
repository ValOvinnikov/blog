import { service } from '@blog/service';
import { HERO_PROFILE_LOG } from '@web/constants/hero-profile';
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
    logger.error(HERO_PROFILE_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }

  return <HeroProfileModuleView id={id} module={result.data} />;
};
