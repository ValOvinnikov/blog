import { service } from '@blog/service';
import { EMBED_LOG } from '@web/constants/embed';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { EmbedModuleView } from './embed-module-view';

export interface IEmbedModuleProps {
  id: string;
}

export const EmbedModule = async ({ id }: IEmbedModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.embed.v1.getEmbedModule(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(EMBED_LOG.MODULE_FETCH_FAILED, { id, error: result.error });
    return null;
  }
  return (
    <EmbedModuleView
      module={result.data}
      titleId={`embed-${id}`}
      dataTestId={`embed-module-${id}`}
    />
  );
};
