import type { TCapability } from '@blog/config/constants';
import {
  getCapabilityOffMessage,
  getMissingCapability,
} from '@blog/studio/schema-types/inputs/capability-warning-input/get-missing-capability';
import type { ItemProps } from 'sanity';

export const createCapabilityWarningItem = (
  enabledCapabilities: readonly TCapability[],
) => {
  return function CapabilityWarningItem(props: ItemProps) {
    const missing = getMissingCapability(
      props.schemaType.name,
      enabledCapabilities,
    );

    if (!missing) {
      return props.renderDefault(props);
    }

    return props.renderDefault({
      ...props,
      validation: [
        ...props.validation,
        {
          level: 'warning',
          message: getCapabilityOffMessage(missing),
          path: props.path,
        },
      ],
    });
  };
};
