import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { TimelineModuleView } from './timeline-module-view';

export interface ITimelineModuleProps {
  id: string;
}

export const TimelineModule = async ({ id }: ITimelineModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.timeline.v1.getTimelineModule(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('timeline_module.fetch_failed', { id, error: result.error });
    return null;
  }

  return (
    <TimelineModuleView
      {...result.data}
      titleId={`timeline-${id}`}
      dataTestId={`timeline-module-${id}`}
    />
  );
};
