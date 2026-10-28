import {
  isModuleTypeEntitled,
  MODULE_PACK_BY_TYPE,
} from '@blog/config/constants';
import { getEntitledModulePacks } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import type { ReferenceFilterSearchOptions } from 'sanity';

export const entitledModuleFilter = (): ReferenceFilterSearchOptions => {
  const entitledModulePacks = getEntitledModulePacks();

  return {
    filter: '!(_type in $offPlanModuleTypes)',
    params: {
      offPlanModuleTypes: Object.keys(MODULE_PACK_BY_TYPE).filter(
        (type) => !isModuleTypeEntitled(type, entitledModulePacks),
      ),
    },
  };
};
