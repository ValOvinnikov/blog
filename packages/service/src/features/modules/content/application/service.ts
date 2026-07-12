import { safeAsync } from '@blog/utils';

import { getContent } from '../adaptor/loader';

export function createContentModuleService() {
  return {
    v1: { getContent: (id: string) => safeAsync(getContent(id)) },
  };
}
