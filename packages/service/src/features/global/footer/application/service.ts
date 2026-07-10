import { safeAsync } from '@blog/utils';

import { getFooter } from '../adaptor/loader';

export function createFooterService() {
  return {
    v1: {
      getFooter: () => safeAsync(getFooter()),
    },
  };
}
