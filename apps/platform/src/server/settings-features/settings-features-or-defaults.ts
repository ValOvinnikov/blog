import 'server-only';

import { PRESET_REGISTRY } from '@blog/config';
import { queries } from '@blog/db';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  featureDefaultsToValues,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';

export const getSettingsFeaturesOrDefaults = async (
  tenantId: string,
): Promise<TSettingsFeaturesValues> => {
  const { features, preset } =
    await queries.settingsFeatures.getSettingsFeaturesAndPreset(tenantId);
  if (features) return features;

  return featureDefaultsToValues(
    PRESET_REGISTRY[preset ?? defaultLookFormValues().preset].featureDefaults,
  );
};
