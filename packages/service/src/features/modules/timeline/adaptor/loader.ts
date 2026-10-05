import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

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
