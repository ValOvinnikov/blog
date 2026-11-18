import 'server-only';

import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import { withParentOffApplied } from '@platform/utils/parent-toggle/parent-toggle';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  CAPABILITY_TOGGLES,
  clampToEntitlement,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import type { TCapability } from '@shinefold/config';

export const getEnabledCapabilities = async ({
  id,
  entitlements,
}: Pick<TPlatformTenant, 'id' | 'entitlements'>): Promise<TCapability[]> => {
  const { values: savedValues } = await getSettingsFeaturesOrDefaults(id);
  const values = withParentOffApplied(
    clampToEntitlement(savedValues, entitlements.capabilities),
  );

  return CAPABILITY_TOGGLES.filter(({ field }) => values[field]).map(
    ({ capability }) => capability,
  );
};
