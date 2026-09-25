import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { timelineModuleQuery } from './query';
import { toTimelineModule } from './transformer';
import type { TTimelineModule } from './types';

export async function getTimelineModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TTimelineModule> {
  const raw = await runQuery(timelineModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:timeline', `module:${id}`, 'link', 'homePage', 'page_landing'],
      tenant.projectId,
    ),
  });

  return toTimelineModule(raw);
}
