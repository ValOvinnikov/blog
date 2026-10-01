import type { TCapability } from '@blog/config/constants';
import {
  CAPABILITY_LABEL,
  getMissingCapability,
} from '@blog/studio/schema-types/inputs/capability-warning-input/get-missing-capability';
import { Card, Stack, Text } from '@sanity/ui';
import type { InputProps } from 'sanity';

export const createCapabilityWarningInput = (
  enabledCapabilities: readonly TCapability[],
) => {
  return function CapabilityWarningInput(props: InputProps) {
    const missing =
      props.path.length === 0
        ? getMissingCapability(props.schemaType.name, enabledCapabilities)
        : null;

    if (!missing) {
      return props.renderDefault(props);
    }

    return (
      <Stack gap={4}>
        <Card tone="caution" padding={3} radius={2} border={true}>
          <Text size={1}>
            This won&apos;t appear on the site until {CAPABILITY_LABEL[missing]}{' '}
            is turned on in Features.
          </Text>
        </Card>
        {props.renderDefault(props)}
      </Stack>
    );
  };
};
