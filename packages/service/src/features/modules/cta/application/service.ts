import { getCta } from '@blog/service/features/modules/cta/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createCtaModuleService() {
  return {
    v1: { getCta: (id: string) => safeAsync(getCta(id)) },
  };
}
