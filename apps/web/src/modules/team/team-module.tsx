import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { TeamModuleView } from './team-module-view';

export interface ITeamModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const TeamModule = async ({ id, tenant }: ITeamModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.team.v1.getTeamModule(id, tenantContext);

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
