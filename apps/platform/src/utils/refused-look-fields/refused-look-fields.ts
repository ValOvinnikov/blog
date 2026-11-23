import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  isLookFieldWithin,
  toEffectiveLookWithin,
} from '@shinefold/db/utils/effective-look/effective-look';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TLookChoices = Omit<TLookFormValues, TBrandAssetKind>;

/** A locked field is a change only when it differs from both the stored value and the preset value shown in its place. */
export const listRefusedLookFields = (
  submitted: TLookChoices,
  stored: TLookFormValues,
  entitlements: Pick<TTenantEntitlements, 'lookFields'>,
): (keyof TLookChoices)[] => {
  const shown = toEffectiveLookWithin(
    { ...stored, preset: submitted.preset },
    entitlements,
  );
  const fields = Object.keys(submitted) as (keyof TLookChoices)[];

  return fields.filter(
    (field) =>
      !isLookFieldWithin(field, entitlements) &&
      submitted[field] !== stored[field] &&
      submitted[field] !== shown[field],
  );
};
