import { safeAsync } from '@blog/utils';

import { getHomePage } from '../adaptor/loader';

export function createHomeService() {
  return {
    v1: { getHomePage: () => safeAsync(getHomePage()) },
  };
}
