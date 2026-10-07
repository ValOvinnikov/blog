import { getIndexPagePagination } from '@blog/service/features/pages/post-index/adaptor/index-page-params/loader';
import { toIndexPageParams } from '@blog/service/features/pages/post-index/adaptor/index-page-params/transformer';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { getFirstPostListPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/page-sizes';

export async function getIndexPageParams(
  tenant: TTenantSanityContext,
): Promise<{ page: string }[]> {
  const { blogPosts, moduleRefs } = await getIndexPagePagination(tenant);
  const [pageSize = null] = await getFirstPostListPageSizes(
    [moduleRefs],
    tenant,
  );

  return toIndexPageParams({ blogPosts, pageSize });
}
