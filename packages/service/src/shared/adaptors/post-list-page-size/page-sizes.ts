import type { TTenantSanityContext } from '@blog/service/sanity/query/query';

import { getPostListPageSizes } from './loader';
import { toFirstPostListPageSize } from './transformer';

type TModuleRef = { _ref: string };

export async function getFirstPostListPageSizes(
  moduleRefsByPage: (TModuleRef[] | null)[],
  tenant: TTenantSanityContext,
): Promise<(number | null)[]> {
  const idsByPage = moduleRefsByPage.map((refs) =>
    (refs ?? []).map(({ _ref }) => _ref),
  );
  const ids = [...new Set(idsByPage.flat())];
  const raw = await getPostListPageSizes(ids, tenant);

  return idsByPage.map((moduleIds) => toFirstPostListPageSize(moduleIds, raw));
}
