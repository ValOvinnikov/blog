import { safeAsync } from '@blog/utils';

import { getSectionPagesModule } from './get-section-pages-module';

export function createSectionPagesModuleService() {
  return {
    v1: {
      getSectionPagesModule: safeAsync(getSectionPagesModule),
    },
  };
}
