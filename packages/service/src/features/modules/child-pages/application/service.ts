import { safeAsync } from '@blog/utils';

import { getChildPagesModule } from './get-child-pages-module';

export function createChildPagesModuleService() {
  return {
    v1: {
      getChildPagesModule: safeAsync(getChildPagesModule),
    },
  };
}
