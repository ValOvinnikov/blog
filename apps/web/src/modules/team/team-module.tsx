import { service } from '@shinefold/service';
import { TEAM_LOG } from '@web/constants/team';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getModuleSection } from '@web/server/site-config/get-module-section/get-module-section';
import { logger } from '@web/utils/logger/logger';

import { TeamModuleView } from './team-module-view';

export interface ITeamModuleProps {
  id: string;
}

export const TeamModule = async ({ id }: ITeamModuleProps) => {
  const { sanityContext, tenantId } = await getRequestContext();
  const result = await service.modules.team.v1.getTeamModule(id, sanityContext);

  if (!result.ok) {
    logger.error(TEAM_LOG.MODULE_FETCH_FAILED, { id, error: result.error });
    return null;
  }

  const { section, content } = await getModuleSection(tenantId, result.data);

  return (
    <TeamModuleView
      {...content}
      section={section}
      titleId={`team-${id}`}
      dataTestId={`team-module-${id}`}
    />
  );
};
