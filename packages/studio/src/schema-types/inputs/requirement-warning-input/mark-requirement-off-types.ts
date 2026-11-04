import type { TMaybeNull } from '@blog/config/types';
import { LockIcon } from '@blog/studio/schema-types/icons/lock-icon/lock-icon';
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
    if (!missing) {
      return { type, offPlan: false };
    }

    const title = `${type.title ?? type.name} ${getRequirementOffSuffix(missing)}`;
    const offPlan = 'modulePack' in missing;

    // Compiled schema types inherit most of their properties, so a spread copy would drop them.
    return {
      type: Object.create(type, {
        title: { value: title },
        ...(offPlan && { icon: { value: LockIcon } }),
      }) as T,
      offPlan,
    };
  });

  if (marked.every(({ type }, index) => type === types[index])) {
    return null;
  }

  return [
    ...marked.filter(({ offPlan }) => !offPlan),
    ...marked.filter(({ offPlan }) => offPlan),
  ].map(({ type }) => type);
};
