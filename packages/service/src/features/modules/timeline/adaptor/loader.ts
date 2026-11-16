import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

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
      ['modules:timeline', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toTimelineModule(raw);
}
