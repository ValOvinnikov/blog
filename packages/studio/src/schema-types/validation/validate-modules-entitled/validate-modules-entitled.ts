import {
  getMissingModulePack,
  getModulePackOffMessage,
} from '@shinefold/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import { getEntitledModulePacks } from '@shinefold/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import {
  modulePath,
  type TModuleReference,
} from '@shinefold/studio/schema-types/validation/module-path/module-path';
import { hasArrayGotItems } from '@shinefold/utils/primitives';

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
