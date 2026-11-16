import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

import { heroStatementModuleQuery } from './query';
import { toHeroStatementModule } from './transformer';
import type { THeroStatementModule } from './types';

export async function getHeroStatement(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroStatementModule> {
  const raw = await runQuery(heroStatementModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:heroStatement', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toHeroStatementModule(raw);
}
