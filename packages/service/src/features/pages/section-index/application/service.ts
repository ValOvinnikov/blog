import { safeAsync } from '@blog/utils';

import { getSectionIndexPage } from './get-section-index-page';

export function createSectionIndexService() {
  return {
    v1: {
      getSectionIndexPage: safeAsync(getSectionIndexPage),
    },
  };
}
