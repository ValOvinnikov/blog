import { getSectionPagesModuleDocument } from '@shinefold/service/features/modules/section-pages/adaptor/module/loader';
import { getSectionPages } from '@shinefold/service/features/modules/section-pages/adaptor/pages/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';

import type { TSectionPagesModule } from './types';

export async function getSectionPagesModule(
  id: string,
  parentId: string,
  parentPath: string,
  tenant: TTenantSanityContext,
): Promise<TSectionPagesModule> {
  const [module, pages] = await Promise.all([
    getSectionPagesModuleDocument(id, tenant),
    getSectionPages(parentId, parentPath, tenant),
  ]);

  return { ...module, pages };
}
