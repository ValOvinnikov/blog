import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { heroStatementModuleQuery } from './query';
import { toHeroStatementModule } from './transformer';
import type { THeroStatementModule } from './types';

// The tags below cover every document type an authored action's link can
// target, so a renamed slug there still invalidates the hero linking to it.
export async function getHeroStatement(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroStatementModule> {
  const raw = await runQuery(heroStatementModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:heroStatement',
        `module:${id}`,
        'page_landing',
        'page_blog',
        'page_post',
        'topic',
      ],
      tenant.projectId,
    ),
  });

  return toHeroStatementModule(raw, tenant);
}
