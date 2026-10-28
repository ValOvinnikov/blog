import {
  getMissingModulePack,
  getModulePackOffMessage,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import { getEntitledModulePacks } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import {
  modulePath,
  type TModuleReference,
} from '@blog/studio/schema-types/validation/module-path/module-path';
import { hasArrayGotItems } from '@blog/utils/primitives';

export const validateModulesEntitled = (modules: unknown) => {
  const entitledModulePacks = getEntitledModulePacks();
  const warnings = ((modules ?? []) as TModuleReference[]).flatMap(
    (module, index) => {
      const modulePack =
        module._type && getMissingModulePack(module._type, entitledModulePacks);

      return modulePack
        ? [
            {
              message: getModulePackOffMessage(modulePack),
              path: modulePath(module, index),
            },
          ]
        : [];
    },
  );

  return hasArrayGotItems(warnings) ? warnings : true;
};
