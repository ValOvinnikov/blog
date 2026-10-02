import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { TimelineModuleView } from './timeline-module-view';

export interface ITimelineModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const TimelineModule = async ({
  id,
  locale,
  tenant,
}: ITimelineModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant, locale);
  const result = await service.modules.timeline.v1.getTimelineModule(
    id,
    tenantContext,
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
