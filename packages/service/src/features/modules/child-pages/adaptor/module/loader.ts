import { getChildPages } from '@blog/service/features/modules/child-pages/adaptor/pages/loader';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { childPagesModuleQuery } from './query';
import { toChildPagesModule } from './transformer';
import type { TChildPagesModule } from './types';

export async function getChildPagesModule(
  id: string,
  parentId: string,
  parentPath: string,
  tenant: TTenantSanityContext,
): Promise<TChildPagesModule> {
  const [raw, pages] = await Promise.all([
    runQuery(childPagesModuleQuery, {
      parameters: { id },
      tenant,
      ...isr(['modules:childPages', `module:${id}`], tenant.projectId),
    }),
    getChildPages(parentId, parentPath, tenant),
  ]);

  return toChildPagesModule(raw, pages);
}
