import { getHero } from '@blog/service/features/modules/hero/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createHeroModuleService() {
  return {
    v1: { getHero: (id: string) => safeAsync(getHero(id)) },
  };
}
