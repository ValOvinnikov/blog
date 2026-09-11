import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { HeroStatementModuleView } from './hero-statement-module-view';

export interface IHeroStatementModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * HeroStatementModule — fetches `module_heroStatement` data and hands it to
 * `HeroStatementModuleView`.
 */
export const HeroStatementModule = async ({
  id,
  tenant,
}: IHeroStatementModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.heroStatement.v1.getHeroStatement(
    id,
    tenantContext,
  );

  if (!result.ok) return null;

  return <HeroStatementModuleView id={id} {...result.data} />;
};
