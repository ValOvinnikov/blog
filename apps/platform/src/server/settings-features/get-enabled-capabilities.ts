import 'server-only';

import type { TCapability } from '@blog/config';
import { PLAN_REGISTRY } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import {
  CAPABILITY_TOGGLES,
  clampToEntitlement,
} from '@platform/utils/settings-features-fields/settings-features-fields';

export const getEnabledCapabilities = async ({
  id,
  plan,
}: Pick<TTenant, 'id' | 'plan'>): Promise<TCapability[]> => {
  const values = clampToEntitlement(
    await getSettingsFeaturesOrDefaults(id),
    PLAN_REGISTRY[plan],
  );

  return CAPABILITY_TOGGLES.filter(({ field }) => values[field]).map(
    ({ capability }) => capability,
  );
};
