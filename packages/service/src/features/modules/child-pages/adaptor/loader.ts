import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { childPagesQuery } from './pages.query';
import { childPagesModuleQuery } from './query';
import { toChildPagesModule } from './transformer';
import type { TChildPagesModule } from './types';

export async function getChildPagesModule(
  id: string,
  parentPath: string,
  tenant: TTenantSanityContext,
): Promise<TChildPagesModule> {
  const [raw, pages] = await Promise.all([
    runQuery(childPagesModuleQuery, {
      parameters: { id },
      tenant,
      ...isr(['modules:childPages', `module:${id}`], tenant.projectId),
    }),
    runQuery(childPagesQuery, {
      parameters: { parentPath },
      tenant,
      ...isr(['page_landing'], tenant.projectId),
    }),
  ]);

  return toChildPagesModule(raw, pages);
}
