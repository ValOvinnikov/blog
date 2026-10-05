import type { TCapability } from '@blog/config/constants';
import { getMissingCapability } from '@blog/studio/schema-types/inputs/capability-warning-input/get-missing-capability';

type TNamedType = { name: string; title?: string };

export const markCapabilityOffTypes = <T extends TNamedType>(
  types: readonly T[],
  enabledCapabilities: readonly TCapability[] | undefined,
): T[] | null => {
  const isOff = (type: T) =>
    getMissingCapability(type.name, enabledCapabilities) !== null;

  if (!types.some(isOff)) {
    return null;
  }

  // Compiled schema types inherit most of their properties, so a spread copy would drop them.
  return types.map((type) =>
    isOff(type)
      ? (Object.create(type, {
          title: { value: `${type.title ?? type.name} (off in Features)` },
        }) as T)
      : type,
  );
};
