import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { HeroStatementModuleView } from './hero-statement-module-view';

export interface IHeroStatementModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const HeroStatementModule = async ({
  id,
  tenant,
}: IHeroStatementModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.heroStatement.v1.getHeroStatement(
    id,
    tenantContext,
  );

  if (!result.ok) {
    logger.error('hero_statement_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  return <HeroStatementModuleView id={id} {...result.data} />;
};
