import { getChildPagesModuleDocument } from '@blog/service/features/modules/child-pages/adaptor/module/loader';
import { getChildPages } from '@blog/service/features/modules/child-pages/adaptor/pages/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';

import type { TChildPagesModule } from './types';

export async function getChildPagesModule(
  id: string,
  parentId: string,
  parentPath: string,
  tenant: TTenantSanityContext,
): Promise<TChildPagesModule> {
  const [module, pages] = await Promise.all([
    getChildPagesModuleDocument(id, tenant),
    getChildPages(parentId, parentPath, tenant),
  ]);

  return { ...module, pages };
}
