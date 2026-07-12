import { safeAsync } from '@blog/utils';

import { getCta } from '../adaptor/loader';

export function createCtaModuleService() {
  return {
    v1: { getCta: (id: string) => safeAsync(getCta(id)) },
  };
}
