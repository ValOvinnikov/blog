import {
  getMissingRequirement,
  getRequirementOffMessage,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import type { ItemProps } from 'sanity';

export const createRequirementWarningItem = (
  entitlements: TEntitlementState,
) => {
  return function RequirementWarningItem(props: ItemProps) {
    const missing = getMissingRequirement(props.schemaType.name, entitlements);

    // A missing module pack is already a warning from the modules field's own validation.
    if (!missing || 'modulePack' in missing) {
      return props.renderDefault(props);
    }

    return props.renderDefault({
      ...props,
      validation: [
        ...props.validation,
        {
          level: 'warning',
          message: getRequirementOffMessage(missing),
          path: props.path,
        },
      ],
    });
  };
};
