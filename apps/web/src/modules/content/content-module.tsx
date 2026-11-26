import { service } from '@shinefold/service';
import { CONTENT_LOG } from '@web/constants/content';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { ContentModuleView } from './content-module-view';

export interface IContentModuleProps {
  id: string;
}

export const ContentModule = async ({ id }: IContentModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.content.v1.getContent(id, sanityContext);

  if (!result.ok) {
    logger.error(CONTENT_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }

  return <ContentModuleView id={id} {...result.data} />;
};
