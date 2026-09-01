import { getPost } from '@blog/service/features/pages/post/adaptor/detail-page/loader';
import { getPostParams } from '@blog/service/features/pages/post/adaptor/detail-page-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createPostService() {
  return {
    v1: {
      getPost: safeAsync((slug: string, tenant?: TTenantSanityContext) =>
        getPost(slug, tenant),
      ),
      getPostParams: safeAsync((tenant?: TTenantSanityContext) =>
        getPostParams(tenant),
      ),
    },
  };
}
