import { getContent } from '@blog/service/features/modules/content/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createContentModuleService() {
  return {
    v1: { getContent: (id: string) => safeAsync(getContent(id)) },
  };
}
