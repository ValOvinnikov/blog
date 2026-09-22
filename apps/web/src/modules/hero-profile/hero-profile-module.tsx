import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { HeroProfileModuleView } from './hero-profile-module-view';

export interface IHeroProfileModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const HeroProfileModule = async ({
  id,
  tenant,
}: IHeroProfileModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.heroProfile.v1.getHeroProfile(
    id,
    tenantContext,
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
