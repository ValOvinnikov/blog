import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { HeroStatementModuleView } from './hero-statement-module-view';

export interface IHeroStatementModuleProps {
  id: string;
}

export const HeroStatementModule = async ({
  id,
}: IHeroStatementModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.heroStatement.v1.getHeroStatement(
    id,
    sanityContext,
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
