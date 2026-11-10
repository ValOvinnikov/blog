import { service } from '@blog/service';
import { HERO_STATEMENT_LOG } from '@web/constants/hero-statement';
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
    logger.error(HERO_STATEMENT_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }

  return <HeroStatementModuleView id={id} module={result.data} />;
};
