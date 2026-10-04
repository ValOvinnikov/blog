import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { TeamModuleView } from './team-module-view';

export interface ITeamModuleProps {
  id: string;
}

export const TeamModule = async ({ id }: ITeamModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.team.v1.getTeamModule(id, sanityContext);

  if (!result.ok) {
    logger.error('team_module.fetch_failed', { id, error: result.error });
    return null;
  }

  return (
    <TeamModuleView
      {...result.data}
      titleId={`team-${id}`}
      dataTestId={`team-module-${id}`}
    />
  );
};
