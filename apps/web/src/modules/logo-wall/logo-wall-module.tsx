import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { LogoWallModuleView } from './logo-wall-module-view';

export interface ILogoWallModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const LogoWallModule = async ({ id, tenant }: ILogoWallModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.logoWall.v1.getLogoWallModule(
    id,
    tenantContext,
  );

  if (!result.ok) {
    logger.error('logo_wall_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }
  if (result.data.logos.length === 0) return null;

  return (
    <LogoWallModuleView
      {...result.data}
      titleId={`logo-wall-${id}`}
      dataTestId={`logo-wall-module-${id}`}
    />
  );
};
