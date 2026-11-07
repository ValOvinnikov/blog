import { markRequirementOffTypes } from '@blog/studio/schema-types/inputs/requirement-warning-input/mark-requirement-off-types/mark-requirement-off-types';
import {
  getMissingRequirement,
  getRequirementOffMessage,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import { createModulePicker } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker';
import { getOffPlanModulePack } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-filter';
import { ModulePickerTypesContext } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-types-context';
import { EVERY_MODULE_PACK } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { hasLength } from '@blog/utils/primitives';
import { Card, Stack, Text } from '@sanity/ui';
import { useMemo } from 'react';
import {
  type InputProps,
  isArrayOfObjectsInputProps,
  isArraySchemaType,
} from 'sanity';

export const createRequirementWarningInput = (
  entitlements: TEntitlementState,
) => {
  const ModulePicker = createModulePicker(entitlements);

  return function RequirementWarningInput(props: InputProps) {
    const { schemaType } = props;
    const { markedArrayType, pickerTypes } = useMemo(() => {
      if (!isArraySchemaType(schemaType)) {
        return { markedArrayType: null, pickerTypes: null };
      }

      const of = markRequirementOffTypes(schemaType.of, entitlements);
      const everyPackOf = markRequirementOffTypes(schemaType.of, {
        ...entitlements,
        entitledModulePacks: EVERY_MODULE_PACK,
      });

      return {
        markedArrayType: of
          ? Object.create(schemaType, { of: { value: of } })
          : null,
        pickerTypes: everyPackOf ?? schemaType.of,
      };
    }, [schemaType]);

    if (markedArrayType) {
      if (
        isArrayOfObjectsInputProps(props) &&
        getOffPlanModulePack(
          markedArrayType.of,
          entitlements.entitledModulePacks,
        )
      ) {
        return (
          <ModulePickerTypesContext.Provider value={pickerTypes}>
            {props.renderDefault({
              ...props,
              schemaType: markedArrayType,
              arrayFunctions: ModulePicker,
            })}
          </ModulePickerTypesContext.Provider>
        );
      }

      return props.renderDefault({ ...props, schemaType: markedArrayType });
    }

    const missing = !hasLength(props.path)
      ? getMissingRequirement(schemaType.name, entitlements)
      : null;

    if (!missing) {
      return props.renderDefault(props);
    }

    return (
      <Stack gap={4}>
        <Card tone="caution" padding={3} radius={2} border={true}>
          <Text size={1}>{getRequirementOffMessage(missing)}</Text>
        </Card>
        {props.renderDefault(props)}
      </Stack>
    );
  };
};
