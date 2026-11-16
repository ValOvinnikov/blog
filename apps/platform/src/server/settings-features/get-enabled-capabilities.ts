import 'server-only';

import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import { withParentOffApplied } from '@platform/utils/parent-toggle/parent-toggle';
import {
  CAPABILITY_TOGGLES,
  clampToEntitlement,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import type { TCapability } from '@shinefold/config';
import { PLAN_REGISTRY } from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';

export const getEnabledCapabilities = async ({
  id,
  plan,
}: Pick<TTenant, 'id' | 'plan'>): Promise<TCapability[]> => {
  const { values: savedValues } = await getSettingsFeaturesOrDefaults(id);
  const values = withParentOffApplied(
    clampToEntitlement(savedValues, PLAN_REGISTRY[plan]),
  );

  return CAPABILITY_TOGGLES.filter(({ field }) => values[field]).map(
    ({ capability }) => capability,
  );
};
