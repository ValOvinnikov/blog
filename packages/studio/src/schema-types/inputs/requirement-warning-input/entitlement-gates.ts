import {
  getMissingModulePack,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import { createRequirementWarningInput } from '@blog/studio/schema-types/inputs/requirement-warning-input/requirement-warning-input';
import { createRequirementWarningItem } from '@blog/studio/schema-types/inputs/requirement-warning-input/requirement-warning-item';
import { definePlugin } from 'sanity';

export const entitlementGates = definePlugin<TEntitlementState>(
  (entitlements) => ({
    name: 'entitlement-gates',
    form: {
      components: {
        input: createRequirementWarningInput(entitlements),
        item: createRequirementWarningItem(entitlements),
      },
    },
    document: {
      // Covers the global Create menu, the desk's create button and a reference's "Create new" alike.
      newDocumentOptions: (prev) =>
        prev.filter(
          ({ templateId }) =>
            !getMissingModulePack(templateId, entitlements.entitledModulePacks),
        ),
    },
  }),
);
