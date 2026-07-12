import { safeAsync } from '@blog/utils';

import { getHero } from '../adaptor/loader';

export function createHeroModuleService() {
  return {
    v1: { getHero: (id: string) => safeAsync(getHero(id)) },
  };
}
