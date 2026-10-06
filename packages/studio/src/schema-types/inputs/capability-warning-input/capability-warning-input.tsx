import type { TCapability } from '@blog/config/constants';
import {
  getCapabilityOffMessage,
  getMissingCapability,
} from '@blog/studio/schema-types/inputs/capability-warning-input/get-missing-capability';
import { markCapabilityOffTypes } from '@blog/studio/schema-types/inputs/capability-warning-input/mark-capability-off-types';
import { Card, Stack, Text } from '@sanity/ui';
import { useMemo } from 'react';
import { type InputProps, isArraySchemaType } from 'sanity';

export const createCapabilityWarningInput = (
  enabledCapabilities: readonly TCapability[],
) => {
  return function CapabilityWarningInput(props: InputProps) {
    const { schemaType } = props;
    const markedArrayType = useMemo(() => {
      const of =
        isArraySchemaType(schemaType) &&
        markCapabilityOffTypes(schemaType.of, enabledCapabilities);

      return of ? Object.create(schemaType, { of: { value: of } }) : null;
    }, [schemaType]);

    if (markedArrayType) {
      return props.renderDefault({ ...props, schemaType: markedArrayType });
    }

    const missing =
      props.path.length === 0
        ? getMissingCapability(schemaType.name, enabledCapabilities)
        : null;

    if (!missing) {
      return props.renderDefault(props);
    }

    return (
      <Stack gap={4}>
        <Card tone="caution" padding={3} radius={2} border={true}>
          <Text size={1}>{getCapabilityOffMessage(missing)}</Text>
        </Card>
        {props.renderDefault(props)}
      </Stack>
    );
  };
};
