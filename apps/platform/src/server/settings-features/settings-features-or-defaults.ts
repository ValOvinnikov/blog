import 'server-only';

import { PRESET_REGISTRY, type TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  featureDefaultsToValues,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';

type TSettingsFeaturesOrDefaults = {
  values: TSettingsFeaturesValues;
  savedAt: TMaybeUndefined<Date>;
};

export const getSettingsFeaturesOrDefaults = async (
  tenantId: string,
): Promise<TSettingsFeaturesOrDefaults> => {
  const { features, updatedAt, preset } =
    await queries.settingsFeatures.getSettingsFeaturesAndPreset(tenantId);
  if (features) return { values: features, savedAt: updatedAt };

  return {
    values: featureDefaultsToValues(
      PRESET_REGISTRY[preset ?? defaultLookFormValues().preset].featureDefaults,
    ),
    savedAt: undefined,
  };
};
