import { getContent } from '@shinefold/service/features/modules/content/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createContentModuleService() {
  return {
    v1: {
      getContent: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getContent(id, tenant),
      ),
    },
  };
}
