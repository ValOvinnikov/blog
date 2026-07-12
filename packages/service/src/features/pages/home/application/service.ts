import { getHomePage } from '@blog/service/features/pages/home/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createHomeService() {
  return {
    v1: { getHomePage: () => safeAsync(getHomePage()) },
  };
}
