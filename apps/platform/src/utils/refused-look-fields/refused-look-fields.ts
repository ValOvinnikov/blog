import type { TTenantPlan } from '@blog/db/constants';
import {
  isLookFieldEntitled,
  toEffectiveLook,
} from '@blog/db/utils/effective-look/effective-look';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export type TLookChoices = Omit<TLookFormValues, 'logo' | 'favicon'>;

/** A locked field is a change only when it differs from both the stored value and the preset value the plan shows instead. */
export const listRefusedLookFields = (
  submitted: TLookChoices,
  stored: TLookFormValues,
  plan: TTenantPlan,
): (keyof TLookChoices)[] => {
  const shown = toEffectiveLook({ ...stored, preset: submitted.preset }, plan);
  const fields = Object.keys(submitted) as (keyof TLookChoices)[];

  return fields.filter(
    (field) =>
      !isLookFieldEntitled(field, plan) &&
      submitted[field] !== stored[field] &&
      submitted[field] !== shown[field],
  );
};
