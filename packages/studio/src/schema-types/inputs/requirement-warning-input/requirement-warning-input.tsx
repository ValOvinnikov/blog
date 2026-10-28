import {
  getMissingRequirement,
  getRequirementOffMessage,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import { markRequirementOffTypes } from '@blog/studio/schema-types/inputs/requirement-warning-input/mark-requirement-off-types';
import { Card, Stack, Text } from '@sanity/ui';
import { useMemo } from 'react';
import { type InputProps, isArraySchemaType } from 'sanity';

export const createRequirementWarningInput = (
  entitlements: TEntitlementState,
) => {
  return function RequirementWarningInput(props: InputProps) {
    const { schemaType } = props;
    const markedArrayType = useMemo(() => {
      const of =
        isArraySchemaType(schemaType) &&
        markRequirementOffTypes(schemaType.of, entitlements);

      return of ? Object.create(schemaType, { of: { value: of } }) : null;
    }, [schemaType]);

    if (markedArrayType) {
      return props.renderDefault({ ...props, schemaType: markedArrayType });
    }

    const missing =
      props.path.length === 0
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
