import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import {
  toPaginationParams,
  type TPaginationParam,
} from '@blog/service/shared/transformers/pagination/to-pagination-params';

import { getFirstPostListPageSizes } from './page-sizes';

type TPaginatedPage = {
  slug: string;
  postCount: number;
  moduleRefs: { _ref: string }[] | null;
};

export async function getPaginationParamsWithPageSizes(
  pages: TPaginatedPage[],
  tenant: TTenantSanityContext,
): Promise<TPaginationParam[]> {
  const pageSizes = await getFirstPostListPageSizes(
    pages.map(({ moduleRefs }) => moduleRefs),
    tenant,
  );

  return toPaginationParams(
    pages.map(({ slug, postCount }, index) => ({
      slug,
      postCount,
      pageSize: pageSizes[index] ?? null,
    })),
  );
}
