import {
  CAPABILITY_TOGGLES,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';

export const blockSwitchOnWhileParentOff = (
  values: TSettingsFeaturesValues,
  stored: TSettingsFeaturesValues,
): TSettingsFeaturesValues => {
  const blocked = { ...values };
  for (const { field, parentField } of CAPABILITY_TOGGLES) {
    if (parentField && !values[parentField]) {
      blocked[field] = values[field] && stored[field];
    }
  }
  return blocked;
};

export const withParentOffApplied = (
  values: TSettingsFeaturesValues,
): TSettingsFeaturesValues => {
  const applied = { ...values };
  for (const { field, parentField } of CAPABILITY_TOGGLES) {
    if (parentField && !values[parentField]) {
      applied[field] = false;
    }
  }
  return applied;
};
