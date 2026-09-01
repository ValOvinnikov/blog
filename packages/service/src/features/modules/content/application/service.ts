import { getContent } from '@blog/service/features/modules/content/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createContentModuleService() {
  return {
    v1: {
      getContent: safeAsync((id: string, tenant?: TTenantSanityContext) =>
        getContent(id, tenant),
      ),
    },
  };
}
