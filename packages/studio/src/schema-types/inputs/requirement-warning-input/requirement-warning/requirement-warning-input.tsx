import { markRequirementOffTypes } from '@blog/studio/schema-types/inputs/requirement-warning-input/mark-requirement-off-types/mark-requirement-off-types';
import {
  getMissingRequirement,
  getRequirementOffMessage,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import { createModulePicker } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker';
import { getOffPlanModulePack } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-sections';
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
    const markedArrayType = useMemo(() => {
      const of =
        isArraySchemaType(schemaType) &&
        markRequirementOffTypes(schemaType.of, entitlements);

      return of ? Object.create(schemaType, { of: { value: of } }) : null;
    }, [schemaType]);

    if (markedArrayType) {
      if (
        isArrayOfObjectsInputProps(props) &&
        getOffPlanModulePack(
          markedArrayType.of,
          entitlements.entitledModulePacks,
        )
      ) {
        return props.renderDefault({
          ...props,
          schemaType: markedArrayType,
          arrayFunctions: ModulePicker,
        });
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
