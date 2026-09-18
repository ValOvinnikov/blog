import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { heroStatementModuleQuery } from './query';
import { toHeroStatementModule } from './transformer';
import type { THeroStatementModule } from './types';

// The tags below cover the `link` document type and every page type the
// Statement Hero can actually be hosted on (`homePage`, `page_landing`), so
// a renamed slug there still invalidates the hero linking to it. The query
// derefs no post/author/topic, so none of those tags belong here.
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
        'link',
        'homePage',
        'page_landing',
      ],
      tenant.projectId,
    ),
  });

  return toHeroStatementModule(raw);
}
