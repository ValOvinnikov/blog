import { safeAsync } from '@shinefold/utils';

import { getHomePage } from './get-home-page';

export function createHomeService() {
  return {
    v1: {
      getHomePage: safeAsync(getHomePage),
    },
  };
}
