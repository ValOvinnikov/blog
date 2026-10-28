import type { TMaybeNull } from '@blog/config/types';
import {
  getMissingRequirement,
  getRequirementOffSuffix,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';

type TNamedType = { name: string; title?: string };

export const markRequirementOffTypes = <T extends TNamedType>(
  types: readonly T[],
  entitlements: TEntitlementState,
): TMaybeNull<T[]> => {
  const marked = types.map((type) => {
    const missing = getMissingRequirement(type.name, entitlements);

    // Compiled schema types inherit most of their properties, so a spread copy would drop them.
    return missing
      ? (Object.create(type, {
          title: {
            value: `${type.title ?? type.name} ${getRequirementOffSuffix(missing)}`,
          },
        }) as T)
      : type;
  });

  return marked.some((type, index) => type !== types[index]) ? marked : null;
};
