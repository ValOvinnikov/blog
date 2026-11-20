import { service } from '@shinefold/service';
import { TIMELINE_LOG } from '@web/constants/timeline';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getModuleSection } from '@web/server/site-config/get-module-section/get-module-section';
import { logger } from '@web/utils/logger/logger';

import { TimelineModuleView } from './timeline-module-view';

export interface ITimelineModuleProps {
  id: string;
}

export const TimelineModule = async ({ id }: ITimelineModuleProps) => {
  const { sanityContext, tenantId } = await getRequestContext();
  const result = await service.modules.timeline.v1.getTimelineModule(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(TIMELINE_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }

  const { section, content } = await getModuleSection(tenantId, result.data);

  return (
    <TimelineModuleView
      {...content}
      section={section}
      titleId={`timeline-${id}`}
      dataTestId={`timeline-module-${id}`}
    />
  );
};
