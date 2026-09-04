import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { HeroModuleView } from './hero-module-view';

export interface IHeroModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * HeroModule — fetches `module_hero` data and hands it to `HeroModuleView`.
 */
export const HeroModule = async ({ id, tenant }: IHeroModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.hero.v1.getHero(id, tenantContext);

  if (!result.ok) return null;

  const { title } = result.data;

  // No title resolved from CMS config or fallback featured post — never
  // render a Hero with an empty top-level <h1>.
  if (!title) return null;

  return <HeroModuleView id={id} {...result.data} title={title} />;
};
