import { getFooter } from '@blog/service/features/global/footer/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createFooterService() {
  return {
    v1: {
      getFooter: () => safeAsync(getFooter()),
    },
  };
}
