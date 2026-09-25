import { getTeamModule } from '@blog/service/features/modules/team/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createTeamModuleService() {
  return {
    v1: {
      getTeamModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getTeamModule(id, tenant),
      ),
    },
  };
}
