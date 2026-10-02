import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { LogoWallModuleView } from './logo-wall-module-view';

export interface ILogoWallModuleProps {
  id: string;
}

export const LogoWallModule = async ({ id }: ILogoWallModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.logoWall.v1.getLogoWallModule(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('logo_wall_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }
  return (
    <LogoWallModuleView
      {...result.data}
      titleId={`logo-wall-${id}`}
      dataTestId={`logo-wall-module-${id}`}
    />
  );
};
