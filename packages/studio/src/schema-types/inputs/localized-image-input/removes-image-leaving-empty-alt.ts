import { localizedStringValues } from '@blog/studio/schema-types/validation/localized-string-values/localized-string-values';
import type { FormPatch } from 'sanity';

const ALT_FIELD_NAME = 'alt';

export const removesImageLeavingEmptyAlt = (
  value: Record<string, unknown> | undefined,
  patches: readonly FormPatch[],
): boolean => {
  if (!value) {
    return false;
  }

  const removedKeys = patches.flatMap((patch) =>
    patch.type === 'unset' && patch.path.length === 1 ? [patch.path[0]] : [],
  );

  if (!removedKeys.includes('asset')) {
    return false;
  }

  const remainingKeys = Object.keys(value).filter(
    (key) => key !== '_type' && !removedKeys.includes(key),
  );

  return (
    remainingKeys.every((key) => key === ALT_FIELD_NAME) &&
    localizedStringValues(value[ALT_FIELD_NAME]).length === 0
  );
};
